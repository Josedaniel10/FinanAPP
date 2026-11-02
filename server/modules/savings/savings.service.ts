import { savingsRepository, SavingsRepository } from './savings.repository';
import { SavingsGoal } from './savings.model';
import { accountRepository, AccountRepository } from '../accounts/account.repository';
import { AppError } from '../../errors/app-error';

export interface CreateSavingsGoalDto {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  accountId?: string;
}

export interface UpdateSavingsGoalDto {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  accountId?: string;
}

export class SavingsService {
  constructor(
    private readonly repository: SavingsRepository = savingsRepository,
    private readonly accRepo: AccountRepository = accountRepository
  ) {}

  async getUserGoals(userId: string): Promise<SavingsGoal[]> {
    return this.repository.findByUserId(userId);
  }

  async createGoal(userId: string, dto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    if (!dto.name || !dto.name.trim()) {
      throw new AppError(400, 'El nombre de la meta de ahorro es obligatorio.');
    }
    if (!dto.targetAmount || dto.targetAmount <= 0) {
      throw new AppError(400, 'El monto objetivo debe ser mayor que 0.');
    }

    if (dto.accountId) {
      const acc = await this.accRepo.findById(dto.accountId);
      if (!acc || acc.userId !== userId) {
        throw new AppError(404, 'La cuenta vinculada no existe o no te pertenece.');
      }
    }

    return this.repository.create({
      userId,
      name: dto.name.trim(),
      targetAmount: dto.targetAmount,
      currentAmount: dto.currentAmount ?? 0,
      targetDate: dto.targetDate,
      color: dto.color,
      icon: dto.icon,
      accountId: dto.accountId,
    });
  }

  async updateGoal(userId: string, id: string, dto: UpdateSavingsGoalDto): Promise<SavingsGoal> {
    const goal = await this.repository.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new AppError(404, 'Meta de ahorro no encontrada.');
    }

    const targetAmount = dto.targetAmount ?? goal.targetAmount;
    const currentAmount = dto.currentAmount ?? goal.currentAmount;
    const isCompleted = currentAmount >= targetAmount;

    const updated = await this.repository.update(id, {
      ...dto,
      isCompleted,
    });

    if (!updated) {
      throw new AppError(500, 'Error actualizando meta de ahorro.');
    }

    return updated;
  }

  async contributeToGoal(
    userId: string,
    id: string,
    amount: number,
    deductFromAccountId?: string
  ): Promise<SavingsGoal> {
    const goal = await this.repository.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new AppError(404, 'Meta de ahorro no encontrada.');
    }

    if (amount <= 0) {
      throw new AppError(400, 'El monto de aporte debe ser mayor que 0.');
    }

    if (deductFromAccountId) {
      const account = await this.accRepo.findById(deductFromAccountId);
      if (!account || account.userId !== userId) {
        throw new AppError(404, 'La cuenta seleccionada no existe o no te pertenece.');
      }
      await this.accRepo.updateBalance(deductFromAccountId, -amount);
    }

    const newCurrent = Math.round((goal.currentAmount + amount) * 100) / 100;
    const isCompleted = newCurrent >= goal.targetAmount;

    const updated = await this.repository.update(id, {
      currentAmount: newCurrent,
      isCompleted,
    });

    return updated!;
  }

  async deleteGoal(userId: string, id: string): Promise<void> {
    const goal = await this.repository.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new AppError(404, 'Meta de ahorro no encontrada.');
    }

    await this.repository.delete(id);
  }
}

export const savingsService = new SavingsService();
