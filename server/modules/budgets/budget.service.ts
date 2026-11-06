import { AppError } from '../../errors/app-error.js';
import { budgetRepository, BudgetRepository } from './budget.repository.js';
import { categoryRepository, CategoryRepository } from '../categories/category.repository.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { CreateBudgetDto, UpdateBudgetDto } from './budget.schema.js';
import { Budget } from './budget.model.js';

export type BudgetAlertStatus = 'NORMAL' | 'WARNING' | 'EXCEEDED';

export interface PopulatedBudget extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  alertStatus: BudgetAlertStatus;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
}

export interface BudgetSummary {
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  budgetsCount: number;
  exceededCount: number;
  warningCount: number;
  normalCount: number;
}

export class BudgetService {
  constructor(
    private readonly budgetRepo: BudgetRepository = budgetRepository,
    private readonly catRepo: CategoryRepository = categoryRepository
  ) {}

  private async calculateBudgetProgress(
    userId: string,
    categoryId: string,
    startDate: string,
    endDate: string,
    limitAmount: number
  ): Promise<{ spent: number; remaining: number; percentage: number; alertStatus: BudgetAlertStatus }> {
    // Query expenses for this category within the budget date range directly in MongoDB
    const result = await TransactionModel.aggregate([
      {
        $match: {
          userId,
          categoryId,
          type: 'EXPENSE',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const rawSpent = result.length > 0 && typeof result[0].totalSpent === 'number' ? result[0].totalSpent : 0;
    const spent = Math.round(rawSpent * 100) / 100;
    const remaining = Math.round((limitAmount - spent) * 100) / 100;
    const percentage = limitAmount > 0 ? Math.round((spent / limitAmount) * 100) : 0;

    let alertStatus: BudgetAlertStatus = 'NORMAL';
    if (percentage >= 100) {
      alertStatus = 'EXCEEDED';
    } else if (percentage >= 80) {
      alertStatus = 'WARNING';
    }

    return { spent, remaining, percentage, alertStatus };
  }

  async create(userId: string, dto: CreateBudgetDto): Promise<PopulatedBudget> {
    const category = await this.catRepo.findById(dto.categoryId);
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError(404, 'La categoría seleccionada no existe o no te pertenece.');
    }

    if (category.type !== 'EXPENSE') {
      throw new AppError(400, 'Los presupuestos solo pueden asignarse a categorías de gasto.');
    }

    const budget = await this.budgetRepo.create({
      userId,
      categoryId: dto.categoryId,
      name: dto.name,
      limitAmount: dto.limitAmount,
      period: dto.period || 'MONTHLY',
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    const progress = await this.calculateBudgetProgress(
      userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate,
      budget.limitAmount
    );

    return {
      ...budget,
      ...progress,
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      },
    };
  }

  async findAll(userId: string): Promise<PopulatedBudget[]> {
    const budgets = await this.budgetRepo.findByUserId(userId);
    const categories = await this.catRepo.findAllForUser(userId);
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const populatedList: PopulatedBudget[] = [];

    for (const b of budgets) {
      const progress = await this.calculateBudgetProgress(
        userId,
        b.categoryId,
        b.startDate,
        b.endDate,
        b.limitAmount
      );

      const cat = catMap.get(b.categoryId);

      populatedList.push({
        ...b,
        ...progress,
        category: cat
          ? {
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              type: cat.type,
            }
          : undefined,
      });
    }

    // Sort: EXCEEDED first, then WARNING, then by percentage descending
    populatedList.sort((a, b) => {
      const priority = { EXCEEDED: 3, WARNING: 2, NORMAL: 1 };
      const diff = priority[b.alertStatus] - priority[a.alertStatus];
      if (diff !== 0) return diff;
      return b.percentage - a.percentage;
    });

    return populatedList;
  }

  async findById(
    id: string,
    userId: string
  ): Promise<PopulatedBudget & { relatedTransactions: any[] }> {
    const budget = await this.budgetRepo.findById(id);
    if (!budget || budget.userId !== userId) {
      throw new AppError(404, 'Presupuesto no encontrado o no autorizado.');
    }

    const category = await this.catRepo.findById(budget.categoryId);
    const progress = await this.calculateBudgetProgress(
      userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate,
      budget.limitAmount
    );

    // Fetch related transactions for audit/breakdown
    const relatedDocs = await TransactionModel.find({
      userId,
      categoryId: budget.categoryId,
      type: 'EXPENSE',
      date: { $gte: budget.startDate, $lte: budget.endDate },
    })
      .sort({ date: -1 })
      .lean();

    const relatedTransactions = relatedDocs.map((doc: any) => ({
      id: doc._id?.toString() || doc.id,
      amount: doc.amount,
      description: doc.description,
      date: doc.date,
      paymentMethod: doc.paymentMethod,
    }));

    return {
      ...budget,
      ...progress,
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type,
          }
        : undefined,
      relatedTransactions,
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateBudgetDto
  ): Promise<PopulatedBudget> {
    const existing = await this.budgetRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Presupuesto no encontrado o no autorizado.');
    }

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const cat = await this.catRepo.findById(dto.categoryId);
      if (!cat || (cat.userId !== null && cat.userId !== userId)) {
        throw new AppError(404, 'La nueva categoría no existe.');
      }
      if (cat.type !== 'EXPENSE') {
        throw new AppError(400, 'Los presupuestos solo pueden asignarse a categorías de gasto.');
      }
    }

    const updated = await this.budgetRepo.update(id, dto);
    if (!updated) {
      throw new AppError(500, 'Error al actualizar el presupuesto.');
    }

    const category = await this.catRepo.findById(updated.categoryId);
    const progress = await this.calculateBudgetProgress(
      userId,
      updated.categoryId,
      updated.startDate,
      updated.endDate,
      updated.limitAmount
    );

    return {
      ...updated,
      ...progress,
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type,
          }
        : undefined,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.budgetRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Presupuesto no encontrado o no autorizado.');
    }

    await this.budgetRepo.delete(id);
  }

  async getSummary(userId: string): Promise<BudgetSummary> {
    const budgets = await this.findAll(userId);

    let totalLimit = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;
    let normalCount = 0;

    for (const b of budgets) {
      totalLimit += b.limitAmount;
      totalSpent += b.spent;

      if (b.alertStatus === 'EXCEEDED') {
        exceededCount++;
      } else if (b.alertStatus === 'WARNING') {
        warningCount++;
      } else {
        normalCount++;
      }
    }

    totalLimit = Math.round(totalLimit * 100) / 100;
    totalSpent = Math.round(totalSpent * 100) / 100;
    const totalRemaining = Math.max(0, Math.round((totalLimit - totalSpent) * 100) / 100);
    const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    return {
      totalLimit,
      totalSpent,
      totalRemaining,
      overallPercentage,
      budgetsCount: budgets.length,
      exceededCount,
      warningCount,
      normalCount,
    };
  }
}

export const budgetService = new BudgetService();
