import Fastify from 'fastify';
import configPlugin from './plugins/config.js';
import ollamaPlugin from './plugins/ollama.js';
import vectorStorePlugin from './plugins/vector-store.js';
import chatApiPlugin from './plugins/chat-api.js';

// 1. Inicializar Fastify
const server = Fastify({ logger: true });

// 2. Registrar todos los plugins
//    Usamos await para asegurarnos de que se carguen en orden.
try {
  await server.register(configPlugin);
  await server.register(ollamaPlugin);
  await server.register(vectorStorePlugin);
  await server.register(chatApiPlugin, { prefix: '/api' }); // Rutas bajo /api

} catch (err) {
  server.log.error(err, 'Error al registrar plugins');
  process.exit(1);
}

// 3. Función de arranque
const start = async () => {
  try {
    // A. Cargamos el PDF *antes* de empezar a escuchar peticiones.
    //    Esta función fue "decorada" (añadida) a `server` por nuestro plugin.
    await server.loadPDF();

    // B. Iniciamos el servidor
    await server.listen({ port: 3000, host: '0.0.0.0' });
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();