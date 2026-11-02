import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

let memoryServerInstance: any = null;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  let mongoUri = env.MONGODB_URI;

  if (!mongoUri) {
    console.log('ℹ️ [MongoDB] No external MONGODB_URI environment variable specified.');
    console.log('🔄 [MongoDB] Initializing persistent local MongoDB instance...');
    try {
      const dbPath = path.resolve(process.cwd(), 'server/data/mongodb');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbPath,
          dbName: env.MONGODB_DB_NAME,
          storageEngine: 'wiredTiger',
        },
      });
      mongoUri = memoryServerInstance.getUri();
      console.log(`✅ [MongoDB] Persistent MongoDB server active at: ${mongoUri}`);
    } catch (err) {
      console.error('❌ [MongoDB] Failed to initialize persistent local MongoDB:', err);
      throw err;
    }
  }

  try {
    mongoose.connection.on('connected', () => {
      console.log('🍃 [MongoDB] Successfully connected to database');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ [MongoDB] Disconnected from database');
    });

    if (!mongoUri) {
      throw new Error('No valid MongoDB connection string was provided or initialized.');
    }

    await mongoose.connect(mongoUri, {
      dbName: env.MONGODB_DB_NAME,
      autoIndex: true,
    });

    return mongoose;
  } catch (err) {
    console.error('❌ [MongoDB] Fatal connection failure:', err);
    throw err;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    console.log('🍃 [MongoDB] Connection closed cleanly');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  }
}
