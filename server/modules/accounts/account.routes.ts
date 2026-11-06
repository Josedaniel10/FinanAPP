import { Router } from 'express';
import { accountController } from './account.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res, next) => accountController.getAccounts(req, res).catch(next));
router.post('/', (req, res, next) => accountController.createAccount(req, res).catch(next));
router.put('/:id', (req, res, next) => accountController.updateAccount(req, res).catch(next));
router.delete('/:id', (req, res, next) => accountController.deleteAccount(req, res).catch(next));

export default router;
