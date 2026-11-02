import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService, CreateAccountDto } from '../services/account.service';

export const ACCOUNT_KEYS = {
  all: ['accounts'] as const,
  list: () => ['accounts', 'list'] as const,
};

export function useAccountsQuery() {
  return useQuery({
    queryKey: ACCOUNT_KEYS.list(),
    queryFn: () => accountService.getAll(),
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAccountDto) => accountService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
