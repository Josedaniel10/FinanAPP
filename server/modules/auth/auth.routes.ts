import { Router } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { validateBody } from '../../middlewares/validate.middleware';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.me);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/password', authenticateToken, authController.changePassword);

export default router;
