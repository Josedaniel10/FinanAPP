import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './server/config/env';
import { connectMongoDB, disconnectMongoDB } from './server/db/mongodb';
import { runDatabaseSeed } from './server/db/seed-database';
import apiRouter from './server/routes/api.routes';
import { errorHandler } from './server/middlewares/error.middleware';

import mongoose from 'mongoose';

async function bootstrap() {
  // 1. Initialize MongoDB Atlas connection and system seed
  let isAtlasConnected = false;
  try {
    await connectMongoDB();
    await runDatabaseSeed();
    isAtlasConnected = true;
  } catch (err: any) {
    console.warn('⚠️ [MongoDB Atlas] Conexión pendiente. El servidor web iniciará en el puerto 3000 para servir la aplicación.');
    console.warn(`👉 Aviso: ${err.message || err}`);
  }

  const app = express();

  // 2. Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware ensuring MongoDB Atlas is ready for transactional API requests
  app.use('/api/v1', (req, res, next) => {
    if (req.path === '/health') {
      return next();
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        code: 'MONGODB_ATLAS_REQUIRED',
        message:
          'FinanAPP está configurada para operar exclusivamente con MongoDB Atlas. Por favor, define tu variable MONGODB_URI en el archivo .env para sincronizar con tu base de datos en la nube.',
      });
    }
    next();
  });

  // 3. API Routes
  app.use('/api/v1', apiRouter);

  // 4. API Error Handling Middleware
  app.use('/api/v1', errorHandler);

  // 5. Frontend serving
  const isProduction = env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // 6. Global error handler fallback
  app.use(errorHandler);

  // AI Studio environment requires server to listen strictly on port 3000
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FinanAPP Server running on http://localhost:${PORT}`);
    console.log(`📡 FinanAPP API v1 ready at http://localhost:${PORT}/api/v1`);
  });

  process.on('SIGINT', async () => {
    await disconnectMongoDB();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectMongoDB();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
