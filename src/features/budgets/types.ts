export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'CUSTOM';

export type BudgetAlertStatus = 'NORMAL' | 'WARNING' | 'EXCEEDED';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  name?: string;
  limitAmount: number;
  period: BudgetPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  spent: number;
  remaining: number;
  percentage: number;
  alertStatus: BudgetAlertStatus;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
}

export interface BudgetWithTransactions extends Budget {
  relatedTransactions?: {
    id: string;
    amount: number;
    description: string;
    date: string;
    paymentMethod?: string;
  }[];
}

export interface CreateBudgetPayload {
  categoryId: string;
  name?: string;
  limitAmount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

export interface UpdateBudgetPayload {
  categoryId?: string;
  name?: string;
  limitAmount?: number;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string;
}

export interface BudgetSummary {
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  budgetsCount: number;
  exceededCount: number;
  warningCount: number;
  normalCount: number;
}
