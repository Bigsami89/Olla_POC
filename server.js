import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import configPlugin from './plugins/config.js';
import ollamaPlugin from './plugins/ollama.js';
import vectorStorePlugin from './plugins/vector-store.js';
import chatApiPlugin from './plugins/chat-api.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Inicializar Fastify
const server = Fastify({ logger: true });

// 2. Configurar CORS para permitir peticiones desde el frontend
//    IMPORTANTE: En producción, especifica el dominio exacto en lugar de usar '*'
try {
  await server.register(cors, {
    origin: true, // En desarrollo permite todos los orígenes
    // En producción, usa algo como:
    // origin: ['https://tu-dominio.com', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  });
  server.log.info('✓ CORS configurado correctamente');
} catch (err) {
  server.log.error(err, 'Error al configurar CORS');
  process.exit(1);
}

// 2.5 Servir archivos estáticos desde la carpeta 'public'
try {
  await server.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/', // Los archivos se servirán desde la raíz
  });
  server.log.info('✓ Servidor de archivos estáticos configurado');
} catch (err) {
  server.log.error(err, 'Error al configurar archivos estáticos');
  process.exit(1);
}

// 3. Registrar todos los plugins
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

// 4. Función de arranque
const start = async () => {
  try {
    // A. Cargamos el PDF *antes* de empezar a escuchar peticiones.
    //    Esta función fue "decorada" (añadida) a `server` por nuestro plugin.
    await server.loadPDF();

    // B. Iniciamos el servidor
    await server.listen({ port: 3000, host: '0.0.0.0' });
    
    server.log.info('════════════════════════════════════════════════');
    server.log.info('🚀 Servidor RAG iniciado correctamente');
    server.log.info('');
    server.log.info('📍 Rutas disponibles:');
    server.log.info('   Frontend:  http://localhost:3000');
    server.log.info('   API Chat:  http://localhost:3000/api/chat');
    server.log.info('');
    server.log.info('💡 Abre http://localhost:3000 en tu navegador');
    server.log.info('════════════════════════════════════════════════');
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();