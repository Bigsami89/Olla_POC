// Este no necesita 'fastify-plugin' porque solo define rutas
// y no necesita ser un ancestro de otros plugins.

/**
 * Construye el prompt final para el LLM.
 * @param {string} context - El texto de los chunks relevantes.
 * @param {string} question - La pregunta original del usuario.
 * @returns {string} - El prompt formateado para RAG.
 */
function buildPrompt(context, question) {
  return `Usa estrictamente el siguiente contexto para responder la pregunta. Si la respuesta no está en el contexto, di 'No lo sé'.

Contexto:
${context}

Pregunta: ${question}

Respuesta:`;
}


/**
 * Plugin que registra la ruta /chat
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {object} options 
 */
async function chatApiPlugin(fastify, options) {
  
  fastify.post('/chat', async (request, reply) => {
    
    // Accedemos a todo desde la instancia de fastify
    const { log, config, ollama, vectorStore, searchVectorStore } = fastify;

    try {
      const { pregunta } = request.body;

      if (!pregunta) {
        return reply.status(400).send({ error: 'El campo "pregunta" es requerido.' });
      }

      if (vectorStore.length === 0) {
        return reply.status(503).send({ error: 'El Vector Store aún no está listo. Intenta de nuevo en unos momentos.' });
      }

      // 1. Vectorizar Pregunta
      const queryEmbedding = await ollama.embeddings({
        model: config.EMBEDDING_MODEL,
        prompt: pregunta,
      });

      // 2. Búsqueda de Similitud
      const relevantChunks = searchVectorStore(queryEmbedding.embedding);
      const context = relevantChunks.map(chunk => chunk.text).join('\n\n---\n\n');

      // 3. Construir Prompt
      const prompt = buildPrompt(context, pregunta);

      // 4. Llamada al LLM
      const llmResponse = await ollama.generate({
        model: config.CHAT_MODEL,
        prompt: prompt,
        stream: false,
      });

      // 5. Retornar Respuesta
      return reply.send({ respuesta: llmResponse.response.trim() });

    } catch (err) {
      log.error(err, 'Error procesando /api/chat');
      return reply.status(500).send({ error: 'Error interno del servidor.' });
    }
  });
}

export default chatApiPlugin;