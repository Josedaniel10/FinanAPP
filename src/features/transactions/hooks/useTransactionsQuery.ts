import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transaction.service';
import { TransactionFilterDto, CreateTransactionDto } from '../types';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  list: (filters?: TransactionFilterDto) => ['transactions', 'list', filters] as const,
  summary: () => ['transactions', 'summary'] as const,
};

export function useTransactionsQuery(filters?: TransactionFilterDto) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filters),
    queryFn: async () => {
      const res = await transactionService.getTransactions(filters);
      return res.data;
    },
  });
}

export function useFinancialSummaryQuery() {
  return useQuery({
    queryKey: TRANSACTION_KEYS.summary(),
    queryFn: async () => {
      const res = await transactionService.getSummary();
      return res.data;
    },
  });
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransactionDto) => transactionService.createTransaction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
