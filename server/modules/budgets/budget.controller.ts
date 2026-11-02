import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { budgetService } from './budget.service';
import { CreateBudgetDto, UpdateBudgetDto } from './budget.schema';

export class BudgetController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const dto = req.body as CreateBudgetDto;
    const budget = await budgetService.create(userId, dto);

    res.status(201).json({
      success: true,
      message: 'Presupuesto establecido correctamente.',
      data: budget,
    });
  }

  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const budgets = await budgetService.findAll(userId);

    res.status(200).json({
      success: true,
      data: budgets,
    });
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const budget = await budgetService.findById(id, userId);

    res.status(200).json({
      success: true,
      data: budget,
    });
  }

  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const summary = await budgetService.getSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateBudgetDto;
    const budget = await budgetService.update(id, userId, dto);

    res.status(200).json({
      success: true,
      message: 'Presupuesto actualizado correctamente.',
      data: budget,
    });
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    await budgetService.delete(id, userId);

    res.status(200).json({
      success: true,
      message: 'Presupuesto eliminado exitosamente.',
    });
  }
}

export const budgetController = new BudgetController();
