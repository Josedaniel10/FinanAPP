import { apiClient } from '../../../shared/lib/api-client';
import { AuthResponse, UserResponse } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      data,
    });
  },

  async login(data: LoginCredentials): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      data,
    });
  },

  async getCurrentUser(): Promise<UserResponse> {
    return apiClient<UserResponse>('/auth/me', {
      method: 'GET',
    });
  },

  async updateProfile(
    data: string | { name?: string; preferredCurrency?: string }
  ): Promise<UserResponse> {
    const payload = typeof data === 'string' ? { name: data } : data;
    return apiClient<UserResponse>('/auth/profile', {
      method: 'PUT',
      data: payload,
    });
  },

  async completeOnboarding(data: {
    preferredCurrency: string;
    initialBalance?: number;
    accountName?: string;
  }): Promise<UserResponse> {
    return apiClient<UserResponse>('/auth/onboarding', {
      method: 'POST',
      data,
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/password', {
      method: 'PUT',
      data: { currentPassword, newPassword },
    });
  },
};
