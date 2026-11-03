import { apiClient } from '../../../shared/lib/api-client';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  accountId?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingsGoalDto {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  accountId?: string;
}

export const savingsService = {
  async getAll(): Promise<SavingsGoal[]> {
    const res = await apiClient<{ success: boolean; data: SavingsGoal[] }>('/savings');
    return res.data;
  },

  async create(dto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    const res = await apiClient<{ success: boolean; data: SavingsGoal }>('/savings', {
      method: 'POST',
      data: dto,
    });
    return res.data;
  },

  async update(id: string, dto: Partial<CreateSavingsGoalDto>): Promise<SavingsGoal> {
    const res = await apiClient<{ success: boolean; data: SavingsGoal }>(`/savings/${id}`, {
      method: 'PUT',
      data: dto,
    });
    return res.data;
  },

  async contribute(id: string, amount: number, deductFromAccountId?: string): Promise<SavingsGoal> {
    const res = await apiClient<{ success: boolean; data: SavingsGoal }>(`/savings/${id}/contribute`, {
      method: 'POST',
      data: { amount, deductFromAccountId },
    });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient(`/savings/${id}`, { method: 'DELETE' });
  },
};
