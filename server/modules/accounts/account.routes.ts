import { Router, Response, NextFunction } from 'express';
import { accountRepository } from './account.repository';
import { authenticateToken, AuthenticatedRequest } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await accountRepository.findByUserId(req.user!.id);
    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
});

export default router;
