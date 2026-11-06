import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticateToken, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();

// Protect all admin endpoints with both token authentication and requireAdmin role check
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/users', (req, res, next) => adminController.getUsers(req, res).catch(next));
router.post('/users/:userId/unlock', (req, res, next) => adminController.unlockUser(req, res).catch(next));
router.patch('/users/:userId/role', (req, res, next) => adminController.updateUserRole(req, res).catch(next));
router.get('/stats', (req, res, next) => adminController.getSystemStats(req, res).catch(next));

export default router;
