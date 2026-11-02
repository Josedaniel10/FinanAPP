import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { savingsService } from './savings.service';

export class SavingsController {
  async getGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
    const goals = await savingsService.getUserGoals(req.user!.id);
    res.json({ success: true, data: goals });
  }

  async createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const goal = await savingsService.createGoal(req.user!.id, req.body);
    res.status(201).json({ success: true, data: goal });
  }

  async updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const goal = await savingsService.updateGoal(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: goal });
  }

  async contribute(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { amount, deductFromAccountId } = req.body;
    const goal = await savingsService.contributeToGoal(
      req.user!.id,
      req.params.id,
      Number(amount),
      deductFromAccountId
    );
    res.json({ success: true, data: goal });
  }

  async deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    await savingsService.deleteGoal(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Meta de ahorro eliminada exitosamente.' });
  }
}

export const savingsController = new SavingsController();
