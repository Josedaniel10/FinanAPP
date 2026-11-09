import { apiClient } from '../../../shared/lib/api-client';
import { User } from '../../auth/types';

export interface AdminUserItem extends User {
  accountCount: number;
  transactionCount: number;
  isLocked: boolean;
}

export interface SystemStats {
  totalUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  adminCount: number;
}

export const adminService = {
  async getUsers(): Promise<AdminUserItem[]> {
    const res = await apiClient<{ success: boolean; data: AdminUserItem[] }>('/admin/users');
    return res.data;
  },

  async unlockUser(userId: string): Promise<string> {
    const res = await apiClient<{ success: boolean; message: string }>(`/admin/users/${userId}/unlock`, {
      method: 'POST',
    });
    return res.message;
  },

  async updateUserRole(userId: string, role: 'ADMIN' | 'USER'): Promise<User> {
    const res = await apiClient<{ success: boolean; data: User }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      data: { role },
    });
    return res.data;
  },

  async deleteUser(userId: string): Promise<string> {
    const res = await apiClient<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    return res.message;
  },

  async getStats(): Promise<SystemStats> {
    const res = await apiClient<{ success: boolean; data: SystemStats }>('/admin/stats');
    return res.data;
  },
};
