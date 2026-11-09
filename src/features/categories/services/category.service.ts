import { apiClient } from '../../../shared/lib/api-client';
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types';

export const categoryService = {
  async getCategories(): Promise<{ data: Category[] }> {
    return apiClient<{ data: Category[] }>('/categories');
  },

  async getCategoryById(id: string): Promise<{ data: Category }> {
    return apiClient<{ data: Category }>(`/categories/${id}`);
  },

  async createCategory(
    payload: CreateCategoryPayload
  ): Promise<{ data: Category; message: string }> {
    return apiClient<{ data: Category; message: string }>('/categories', {
      method: 'POST',
      data: payload,
    });
  },

  async updateCategory(
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<{ data: Category; message: string }> {
    return apiClient<{ data: Category; message: string }>(`/categories/${id}`, {
      method: 'PUT',
      data: payload,
    });
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  async getExcludedCategories(): Promise<{ data: Category[] }> {
    return apiClient<{ data: Category[] }>('/categories/excluded');
  },

  async restoreCategory(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/categories/${id}/restore`, {
      method: 'POST',
    });
  },
};
