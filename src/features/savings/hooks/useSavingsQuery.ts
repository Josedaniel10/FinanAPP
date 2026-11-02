import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService, CreateSavingsGoalDto } from '../services/savings.service';

export const SAVINGS_KEYS = {
  all: ['savings'] as const,
  list: () => ['savings', 'list'] as const,
};

export function useSavingsGoalsQuery() {
  return useQuery({
    queryKey: SAVINGS_KEYS.list(),
    queryFn: () => savingsService.getAll(),
  });
}

export function useCreateSavingsGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSavingsGoalDto) => savingsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_KEYS.all });
    },
  });
}

export function useContributeSavingsGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      deductFromAccountId,
    }: {
      id: string;
      amount: number;
      deductFromAccountId?: string;
    }) => savingsService.contribute(id, amount, deductFromAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteSavingsGoalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVINGS_KEYS.all });
    },
  });
}
