import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Conexión exclusiva y estricta a MongoDB Atlas (Nube).
 * Se eliminó por completo cualquier motor en memoria local.
 */
export async function connectMongoDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const rawUri = env.MONGODB_URI?.trim();

  if (!rawUri) {
    const missingUriMessage =
      '❌ [MongoDB Atlas] ERROR CRÍTICO: La variable de entorno MONGODB_URI no está definida en .env.\n' +
      '👉 FinanAPP requiere conectarse obligatoriamente a MongoDB Atlas.\n' +
      '👉 Por favor, define en tu archivo .env la cadena de conexión de tu cluster:\n' +
      '   MONGODB_URI="mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/finanapp?retryWrites=true&w=majority"\n' +
      '   MONGODB_DB_NAME="finanapp"';
    console.error(missingUriMessage);
    throw new Error('MONGODB_URI no configurada en .env. Conexión a MongoDB Atlas requerida.');
  }

  console.log('🌐 [MongoDB Atlas] Conectando directamente y de forma exclusiva al cluster en la nube...');
  console.log(`📡 [MongoDB Atlas] Base de datos objetivo: "${env.MONGODB_DB_NAME || 'finanapp'}"`);

  mongoose.connection.on('connected', () => {
    console.log('🍃 [MongoDB Atlas] Conexión establecida exitosamente con la nube.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ [MongoDB Atlas] Error en la conexión:', err.message || err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ [MongoDB Atlas] Conexión cerrada con la base de datos.');
  });

  try {
    await mongoose.connect(rawUri, {
      dbName: env.MONGODB_DB_NAME || 'finanapp',
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });

    return mongoose;
  } catch (err: any) {
    console.error('❌ [MongoDB Atlas] Error fatal conectando a MongoDB Atlas:', err.message || err);
    throw err;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🍃 [MongoDB Atlas] Desconectado limpiamente de MongoDB Atlas.');
    }
  } catch (err) {
    console.error('Error durante la desconexión de MongoDB Atlas:', err);
  }
}
