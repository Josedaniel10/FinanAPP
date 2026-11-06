import { Router } from 'express';
import { authController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.me);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/password', authenticateToken, authController.changePassword);

export default router;
