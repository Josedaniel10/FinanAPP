import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './server/config/env';
import { connectMongoDB, disconnectMongoDB } from './server/db/mongodb';
import { runMongoMigrationAndSeeds } from './server/db/migration';
import apiRouter from './server/routes/api.routes';
import { errorHandler } from './server/middlewares/error.middleware';

async function bootstrap() {
  // 1. Initialize MongoDB connection and migration/seeds
  await connectMongoDB();
  await runMongoMigrationAndSeeds();

  const app = express();

  // 2. Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  const PORT = env.PORT || 3000;
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
