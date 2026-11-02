import { apiClient } from '../../../shared/lib/api-client';
import {
  Budget,
  BudgetWithTransactions,
  BudgetSummary,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from '../types';

export const budgetService = {
  async getBudgets(): Promise<{ data: Budget[] }> {
    return apiClient<{ data: Budget[] }>('/budgets');
  },

  async getBudgetById(id: string): Promise<{ data: BudgetWithTransactions }> {
    return apiClient<{ data: BudgetWithTransactions }>(`/budgets/${id}`);
  },

  async getSummary(): Promise<{ data: BudgetSummary }> {
    return apiClient<{ data: BudgetSummary }>('/budgets/summary');
  },

  async createBudget(
    payload: CreateBudgetPayload
  ): Promise<{ data: Budget; message: string }> {
    return apiClient<{ data: Budget; message: string }>('/budgets', {
      method: 'POST',
      data: payload,
    });
  },

  async updateBudget(
    id: string,
    payload: UpdateBudgetPayload
  ): Promise<{ data: Budget; message: string }> {
    return apiClient<{ data: Budget; message: string }>(`/budgets/${id}`, {
      method: 'PUT',
      data: payload,
    });
  },

  async deleteBudget(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },
};
