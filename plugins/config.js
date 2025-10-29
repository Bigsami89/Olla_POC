import fp from 'fastify-plugin';

// Todas nuestras constantes de configuración
const config = {
  PDF_PATH: '/home/samuel/Documentos/rag-poc-fastify/Prince.pdf',
  EMBEDDING_MODEL: 'nomic-embed-text',
  CHAT_MODEL: 'phi3',
  OLLAMA_HOST: 'http://localhost:11434',
  K_RESULTS: 3, // Número de chunks relevantes a recuperar
};

/**
 * Plugin de Fastify para decorar la instancia con la configuración.
 * 'fp' evita que Fastify encapsule este plugin, haciéndolo
 * global para todas las demás partes de la aplicación.
 */
async function configPlugin(fastify, options) {
  fastify.decorate('config', config);
}

export default fp(configPlugin, {
  name: 'configPlugin'  // <- AGREGAR ESTO
});