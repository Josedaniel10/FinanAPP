import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import transactionRoutes from '../modules/transactions/transaction.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import accountRoutes from '../modules/accounts/account.routes.js';
import budgetRoutes from '../modules/budgets/budget.routes.js';
import savingsRoutes from '../modules/savings/savings.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';

import mongoose from 'mongoose';

const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req, res) => {
  const isAtlasConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isAtlasConnected ? 'MongoDB Atlas (Conectado)' : 'MongoDB Atlas (Pendiente MONGODB_URI)',
    app: 'FinanAPP API',
    version: '2.0.0',
    architecture: 'Clean Architecture Modular',
    timestamp: new Date().toISOString(),
  });
});

// Modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/accounts', accountRoutes);
apiRouter.use('/budgets', budgetRoutes);
apiRouter.use('/savings', savingsRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
