import { apiClient } from '../../../shared/lib/api-client';
import {
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  FinancialSummary,
  Category,
  Account,
  TransactionFilterParams,
} from '../types';

export const transactionService = {
  async getSummary(): Promise<{ data: FinancialSummary }> {
    return apiClient<{ data: FinancialSummary }>('/transactions/summary');
  },

  async getTransactions(
    filters?: TransactionFilterParams
  ): Promise<{ data: Transaction[] }> {
    return apiClient<{ data: Transaction[] }>('/transactions', {
      params: filters as Record<string, string | undefined>,
    });
  },

  async getTransactionById(
    id: string
  ): Promise<{ data: Transaction }> {
    return apiClient<{ data: Transaction }>(`/transactions/${id}`);
  },

  async createTransaction(
    payload: CreateTransactionPayload
  ): Promise<{ data: Transaction; message: string }> {
    return apiClient<{ data: Transaction; message: string }>('/transactions', {
      method: 'POST',
      data: payload,
    });
  },

  async updateTransaction(
    id: string,
    payload: UpdateTransactionPayload
  ): Promise<{ data: Transaction; message: string }> {
    return apiClient<{ data: Transaction; message: string }>(`/transactions/${id}`, {
      method: 'PUT',
      data: payload,
    });
  },

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  async getCategories(): Promise<{ data: Category[] }> {
    return apiClient<{ data: Category[] }>('/categories');
  },

  async getAccounts(): Promise<{ data: Account[] }> {
    return apiClient<{ data: Account[] }>('/accounts');
  },
};
