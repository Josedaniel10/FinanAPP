import { create } from 'zustand';
import { User, LockInfo } from '../features/auth/types';
import { authService, LoginCredentials, RegisterData } from '../features/auth/services/auth.service';
import { ApiError } from '../shared/lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  lockInfo: LockInfo | null;
  attemptsRemaining: number | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('finanapp_token'),
  isLoading: true,
  error: null,
  lockInfo: null,
  attemptsRemaining: null,

  setUser: (user: User) => {
    localStorage.setItem('finanapp_user', JSON.stringify(user));
    set({ user });
  },

  refreshUser: async () => {
    try {
      const response = await authService.getCurrentUser();
      const user = response.data.user;
      localStorage.setItem('finanapp_user', JSON.stringify(user));
      set({ user });
    } catch {
      // keep current user or ignore
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('finanapp_token');
    const storedUser = localStorage.getItem('finanapp_user');

    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      if (storedUser) {
        set({ user: JSON.parse(storedUser), token });
      }

      // Verify token with backend
      const response = await authService.getCurrentUser();
      const user = response.data.user;
      localStorage.setItem('finanapp_user', JSON.stringify(user));
      set({ user, token, isLoading: false, error: null });
    } catch {
      localStorage.removeItem('finanapp_token');
      localStorage.removeItem('finanapp_user');
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null, lockInfo: null, attemptsRemaining: null });
    try {
      const response = await authService.login(credentials);
      const { user, token } = response.data;

      localStorage.setItem('finanapp_token', token);
      localStorage.setItem('finanapp_user', JSON.stringify(user));

      set({
        user,
        token,
        isLoading: false,
        error: null,
        lockInfo: null,
        attemptsRemaining: null,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      const details = apiErr.details as any;

      const isLocked = apiErr.statusCode === 423 || Boolean(details?.lockUntil);
      const minutesRemaining = details?.minutesRemaining || 15;
      const lockUntil = details?.lockUntil || null;
      const attemptsRemaining =
        typeof details?.attemptsRemaining === 'number'
          ? details.attemptsRemaining
          : null;

      set({
        isLoading: false,
        error: apiErr.message || 'Error al iniciar sesión',
        lockInfo: isLocked
          ? {
              isLocked: true,
              minutesRemaining,
              lockUntil,
            }
          : null,
        attemptsRemaining,
      });

      throw err;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null, lockInfo: null, attemptsRemaining: null });
    try {
      const response = await authService.register(data);
      const { user, token } = response.data;

      localStorage.setItem('finanapp_token', token);
      localStorage.setItem('finanapp_user', JSON.stringify(user));

      set({
        user,
        token,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      set({
        isLoading: false,
        error: apiErr.message || 'Error al registrar la cuenta',
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('finanapp_token');
    localStorage.removeItem('finanapp_user');
    set({
      user: null,
      token: null,
      error: null,
      lockInfo: null,
      attemptsRemaining: null,
    });
  },

  clearError: () => {
    set({ error: null, lockInfo: null, attemptsRemaining: null });
  },
}));
