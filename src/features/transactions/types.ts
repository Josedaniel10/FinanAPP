export type TransactionType = 'INCOME' | 'EXPENSE';

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type PaymentMethodType =
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'TRANSFER'
  | 'OTHER';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  recurrence?: RecurrenceType;
  paymentMethod?: PaymentMethodType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  account?: Account;
}

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId?: string;
  date: string;
  description: string;
  recurrence?: RecurrenceType;
  paymentMethod?: PaymentMethodType;
  notes?: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export interface TransactionFilterParams {
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  type: TransactionType;
  total: number;
  count: number;
  percentage: number;
}

export interface FinancialSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionsCount: number;
  categoryBreakdown: CategoryBreakdownItem[];
}
