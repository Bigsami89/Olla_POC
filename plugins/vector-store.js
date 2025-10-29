import fp from 'fastify-plugin';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import pdf from 'pdf-parse-new';
import { promises as fs } from 'fs';

// --- Funciones de Lógica Vectorial (privadas del plugin) ---

function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  if (v1.length !== v2.length) {
    throw new Error('Los vectores deben tener la misma dimensión');
  }
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    mag1 += v1[i] * v1[i];
    mag2 += v2[i] * v2[i];
  }
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

function findRelevantChunks(vectorStore, queryVector, k) {
  const similarities = vectorStore.map(entry => ({
    text: entry.text,
    similarity: cosineSimilarity(queryVector, entry.vector),
  }));
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, k);
}

// --- Definición del Plugin ---

async function vectorStorePlugin(fastify, options) {
  
  // 1. Crear el almacén en memoria
  const vectorStore = [];
  fastify.decorate('vectorStore', vectorStore); // Decoramos el array mismo

  // 2. Decorar la función de búsqueda
  fastify.decorate('searchVectorStore', (queryVector) => {
    const k = fastify.config.K_RESULTS;
    return findRelevantChunks(vectorStore, queryVector, k);
  });

  // 3. Decorar la función de carga del PDF
  //    Esta función será llamada desde server.js ANTES de iniciar.
  async function loadAndProcessPDF() {
    // Usamos las dependencias decoradas (log, config, ollama)
    const { log, config, ollama } = fastify;

    try {
      log.info(`Iniciando carga de ${config.PDF_PATH}...`);

      const dataBuffer = await fs.readFile(config.PDF_PATH);
      const pdfData = await pdf(dataBuffer);
      const text = pdfData.text;
      log.info('PDF cargado y texto extraído.');

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
      });
      const chunks = await splitter.splitText(text);
      log.info(`Texto dividido en ${chunks.length} chunks.`);

      const embeddingPromises = chunks.map(async (chunk) => {
        try {
          const response = await ollama.embeddings({
            model: config.EMBEDDING_MODEL,
            prompt: chunk,
          });
          return { text: chunk, vector: response.embedding };
        } catch (err) {
          log.error(err, `Error vectorizando chunk`);
          return null;
        }
      });

      const results = (await Promise.all(embeddingPromises)).filter(Boolean);
      
      // Añadimos los resultados al vectorStore decorado
      vectorStore.push(...results); 
      
      log.info(`Vector store listo. ${vectorStore.length} chunks vectorizados.`);

    } catch (err) {
      log.fatal(err, 'Error fatal durante la carga del PDF.');
      process.exit(1);
    }
  }

  fastify.decorate('loadPDF', loadAndProcessPDF);
}

export default fp(vectorStorePlugin, {
  name: 'vectorStorePlugin',  // <- AGREGAR ESTO
  dependencies: ['configPlugin', 'ollamaPlugin'],
});