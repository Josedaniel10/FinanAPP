import { apiClient } from '../../../shared/lib/api-client';

export type AccountType = 'CASH' | 'BANK' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'OTHER';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  isDefault?: boolean;
}

export const accountService = {
  async getAll(): Promise<Account[]> {
    const res = await apiClient<{ success?: boolean; data: Account[] }>('/accounts');
    return res.data;
  },

  async create(dto: CreateAccountDto): Promise<Account> {
    const res = await apiClient<{ success?: boolean; data: Account }>('/accounts', {
      method: 'POST',
      data: dto,
    });
    return res.data;
  },

  async update(id: string, dto: Partial<CreateAccountDto>): Promise<Account> {
    const res = await apiClient<{ success?: boolean; data: Account }>(`/accounts/${id}`, {
      method: 'PUT',
      data: dto,
    });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient(`/accounts/${id}`, { method: 'DELETE' });
  },
};
