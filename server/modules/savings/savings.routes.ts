import { Router } from 'express';
import { savingsController } from './savings.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res, next) => savingsController.getGoals(req, res).catch(next));
router.post('/', (req, res, next) => savingsController.createGoal(req, res).catch(next));
router.put('/:id', (req, res, next) => savingsController.updateGoal(req, res).catch(next));
router.post('/:id/contribute', (req, res, next) => savingsController.contribute(req, res).catch(next));
router.delete('/:id', (req, res, next) => savingsController.deleteGoal(req, res).catch(next));

export default router;
