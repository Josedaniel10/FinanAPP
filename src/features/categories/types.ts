export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string | null; // null for system defaults
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  budgetLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}
