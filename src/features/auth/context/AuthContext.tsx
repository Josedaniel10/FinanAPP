import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, LockInfo } from '../types';
import { authService } from '../services/auth.service';
import { ApiError } from '../../../shared/lib/api-client';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  lockInfo: LockInfo | null;
  attemptsRemaining: number | null;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'finanapp_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const clearError = () => {
    setError(null);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
    setLockInfo(null);
    setAttemptsRemaining(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      setUser(response.data.user);
    } catch {
      // If token expired or invalid, log out
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    setLockInfo(null);
    setAttemptsRemaining(null);

    try {
      const response = await authService.login(data);
      const { user: loggedInUser, token: authToken } = response.data;
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
      setUser(loggedInUser);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.statusCode === 423) {
          const details = err.details as { lockUntil?: number; minutesRemaining?: number } | undefined;
          setLockInfo({
            isLocked: true,
            minutesRemaining: details?.minutesRemaining || 15,
            lockUntil: details?.lockUntil || null,
          });
        } else if (err.statusCode === 401) {
          const details = err.details as { attemptsRemaining?: number } | undefined;
          if (details?.attemptsRemaining !== undefined) {
            setAttemptsRemaining(details.attemptsRemaining);
          }
        }
      } else {
        setError('Error al intentar conectar con el servidor.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    setLockInfo(null);
    setAttemptsRemaining(null);

    try {
      const response = await authService.register(data);
      const { user: registeredUser, token: authToken } = response.data;
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
      setUser(registeredUser);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al registrar usuario.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        lockInfo,
        attemptsRemaining,
        login,
        register,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '../hooks/useAuth';
