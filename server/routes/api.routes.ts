import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import transactionRoutes from '../modules/transactions/transaction.routes';
import categoryRoutes from '../modules/categories/category.routes';
import accountRoutes from '../modules/accounts/account.routes';
import budgetRoutes from '../modules/budgets/budget.routes';
import savingsRoutes from '../modules/savings/savings.routes';
import adminRoutes from '../modules/admin/admin.routes';

const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
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
