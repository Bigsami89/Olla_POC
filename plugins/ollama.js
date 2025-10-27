import fp from 'fastify-plugin';
import { Ollama } from 'ollama';

/**
 * Plugin que inicializa y decora el cliente de Ollama.
 */
async function ollamaPlugin(fastify, options) {
  // Obtenemos la configuración que el plugin anterior decoró
  const { OLLAMA_HOST } = fastify.config;

  const ollama = new Ollama({ host: OLLAMA_HOST });

  try {
    // Hacemos un ping rápido a Ollama al iniciar para asegurar la conexión
    await ollama.list();
    fastify.log.info('Conexión con Ollama establecida.');
  } catch (err) {
    fastify.log.error(err, 'No se pudo conectar con Ollama. Asegúrate de que esté ejecutándose.');
    process.exit(1);
  }

  fastify.decorate('ollama', ollama);
}

// Declaramos que este plugin depende de 'configPlugin'
// Fastify se asegurará de que 'configPlugin' se ejecute primero.
export default fp(ollamaPlugin, {
  dependencies: ['configPlugin'],
});