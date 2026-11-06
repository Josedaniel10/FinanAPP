import { Router } from 'express';
import { budgetController } from './budget.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { createBudgetSchema, updateBudgetSchema } from './budget.schema.js';

const budgetRoutes = Router();

// Protect all budget routes with JWT authentication
budgetRoutes.use(authenticateToken);

budgetRoutes.get('/summary', (req, res, next) => {
  budgetController.getSummary(req, res).catch(next);
});

budgetRoutes.get('/', (req, res, next) => {
  budgetController.getAll(req, res).catch(next);
});

budgetRoutes.post('/', validateBody(createBudgetSchema), (req, res, next) => {
  budgetController.create(req, res).catch(next);
});

budgetRoutes.get('/:id', (req, res, next) => {
  budgetController.getById(req, res).catch(next);
});

budgetRoutes.put('/:id', validateBody(updateBudgetSchema), (req, res, next) => {
  budgetController.update(req, res).catch(next);
});

budgetRoutes.delete('/:id', (req, res, next) => {
  budgetController.delete(req, res).catch(next);
});

export default budgetRoutes;
