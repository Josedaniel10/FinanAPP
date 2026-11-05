import { useAuthStore } from '../../../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,
    error: store.error,
    lockInfo: store.lockInfo,
    attemptsRemaining: store.attemptsRemaining,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
    refreshUser: store.refreshUser,
    setUser: store.setUser,
  };
};
