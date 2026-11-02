import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const ADMIN_KEYS = {
  all: ['admin'] as const,
  users: () => ['admin', 'users'] as const,
  stats: () => ['admin', 'stats'] as const,
};

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: ADMIN_KEYS.users(),
    queryFn: () => adminService.getUsers(),
  });
}

export function useAdminStatsQuery() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats(),
    queryFn: () => adminService.getStats(),
  });
}

export function useUnlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.unlockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all });
    },
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'ADMIN' | 'USER' }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all });
    },
  });
}
