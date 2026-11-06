import { Router } from 'express';
import { transactionController } from './transaction.controller.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
} from './transaction.schema.js';
import { validateBody, validateQuery } from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply auth middleware to all transaction endpoints
router.use(authenticateToken);

router.get('/summary', transactionController.summary);
router.get('/', validateQuery(transactionFilterSchema), transactionController.list);
router.get('/:id', transactionController.getById);
router.post('/', validateBody(createTransactionSchema), transactionController.create);
router.put('/:id', validateBody(updateTransactionSchema), transactionController.update);
router.delete('/:id', transactionController.delete);

export default router;
