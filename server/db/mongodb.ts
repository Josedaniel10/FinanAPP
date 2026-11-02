import mongoose from 'mongoose';
import { env } from '../config/env';

let memoryServerFallback: any = null;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const rawUri = env.MONGODB_URI?.trim();
  const hasValidAtlasUri =
    Boolean(rawUri) &&
    !rawUri?.includes('<usuario>') &&
    !rawUri?.includes('<password>') &&
    (rawUri?.startsWith('mongodb+srv://') || rawUri?.startsWith('mongodb://'));

  let targetUri = rawUri;

  if (hasValidAtlasUri && targetUri) {
    console.log('🌐 [MongoDB Atlas] Conectando directamente al cluster en la nube...');
    console.log(`📡 [MongoDB Atlas] Base de datos objetivo: "${env.MONGODB_DB_NAME}"`);
  } else {
    console.log('ℹ️ [MongoDB Atlas] No se detectó una URI válida de MongoDB Atlas configurada en .env.');
    console.log('👉 Para conectar con tu base de datos de MongoDB oficial en la nube, edita .env y coloca:');
    console.log('   MONGODB_URI="mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/finanapp?retryWrites=true&w=majority"');
    console.log('⚡ [MongoDB] Iniciando instancia temporal en memoria para permitir pruebas inmediatas sin archivos locales...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerFallback = await MongoMemoryServer.create({
        instance: {
          dbName: env.MONGODB_DB_NAME,
        },
      });
      targetUri = memoryServerFallback.getUri();
      console.log('✅ [MongoDB] Instancia en memoria inicializada correctamente.');
    } catch (err) {
      console.error('❌ [MongoDB] Error iniciando instancia de soporte:', err);
      throw err;
    }
  }

  try {
    mongoose.connection.on('connected', () => {
      console.log('🍃 [MongoDB] Conexión establecida exitosamente.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [MongoDB] Error de conexión:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ [MongoDB] Desconectado de la base de datos.');
    });

    if (!targetUri) {
      throw new Error('URI de conexión a MongoDB no disponible.');
    }

    await mongoose.connect(targetUri, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: true,
      serverSelectionTimeoutMS: 8000,
    });

    return mongoose;
  } catch (err) {
    console.error('❌ [MongoDB] Error fatal conectando a MongoDB:', err);
    throw err;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServerFallback) {
      await memoryServerFallback.stop();
      memoryServerFallback = null;
    }
    console.log('🍃 [MongoDB] Conexión cerrada limpiamente.');
  } catch (err) {
    console.error('Error durante la desconexión de MongoDB:', err);
  }
}
