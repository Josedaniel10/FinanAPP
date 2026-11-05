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

  async updateProfile(name: string): Promise<UserResponse> {
    return apiClient<UserResponse>('/auth/profile', {
      method: 'PUT',
      data: { name },
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/password', {
      method: 'PUT',
      data: { currentPassword, newPassword },
    });
  },
};
