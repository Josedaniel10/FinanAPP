import { AppError } from '../../errors/app-error';
import { accountRepository, AccountRepository } from '../accounts/account.repository';
import { categoryRepository, CategoryRepository } from '../categories/category.repository';
import { transactionRepository, TransactionRepository } from './transaction.repository';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFilterDto } from './transaction.schema';
import { Transaction } from './transaction.model';

export interface PopulatedTransaction extends Transaction {
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
  account?: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };
}

export interface FinancialSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionsCount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    type: 'INCOME' | 'EXPENSE';
    total: number;
    count: number;
    percentage: number;
  }[];
}

export class TransactionService {
  constructor(
    private readonly txRepo: TransactionRepository = transactionRepository,
    private readonly accRepo: AccountRepository = accountRepository,
    private readonly catRepo: CategoryRepository = categoryRepository
  ) {}

  private async resolveAccount(userId: string, accountId?: string) {
    if (accountId) {
      const acc = await this.accRepo.findById(accountId);
      if (!acc || acc.userId !== userId) {
        throw new AppError(404, 'La cuenta seleccionada no existe o no te pertenece.');
      }
      return acc;
    }

    // Default account fallback
    let defaultAcc = await this.accRepo.findDefaultByUserId(userId);
    if (!defaultAcc) {
      const userAccounts = await this.accRepo.findByUserId(userId);
      defaultAcc = userAccounts[0] || null;
    }

    if (!defaultAcc) {
      // Auto-create default account if none exists
      defaultAcc = await this.accRepo.create({
        userId,
        name: 'Cuenta Principal',
        type: 'CASH',
        balance: 0,
        currency: 'USD',
        isDefault: true,
      });
    }

    return defaultAcc;
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<PopulatedTransaction> {
    const account = await this.resolveAccount(userId, dto.accountId);

    // Verify category exists
    const category = await this.catRepo.findById(dto.categoryId);
    if (!category) {
      throw new AppError(404, 'La categoría seleccionada no existe.');
    }

    // Amount validation
    if (dto.amount <= 0) {
      throw new AppError(400, 'El monto del movimiento debe ser mayor que 0.');
    }

    // Calculate balance delta: Income increases balance (+), Expense decreases balance (-)
    const delta = dto.type === 'INCOME' ? dto.amount : -dto.amount;

    // Update account balance
    const updatedAccount = await this.accRepo.updateBalance(account.id, delta);
    if (!updatedAccount) {
      throw new AppError(500, 'No se pudo actualizar el balance de la cuenta.');
    }

    // Persist transaction
    const tx = await this.txRepo.create({
      userId,
      accountId: account.id,
      categoryId: category.id,
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
      date: dto.date,
      recurrence: dto.recurrence,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
    });

    return {
      ...tx,
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      },
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        type: updatedAccount.type,
        currency: updatedAccount.currency,
      },
    };
  }

  async findAll(
    userId: string,
    filters?: TransactionFilterDto
  ): Promise<PopulatedTransaction[]> {
    let txs = await this.txRepo.findByUserId(userId);

    // Apply filters if provided
    if (filters) {
      if (filters.type) {
        txs = txs.filter((t) => t.type === filters.type);
      }
      if (filters.categoryId) {
        txs = txs.filter((t) => t.categoryId === filters.categoryId);
      }
      if (filters.accountId) {
        txs = txs.filter((t) => t.accountId === filters.accountId);
      }
      if (filters.startDate) {
        txs = txs.filter((t) => t.date >= filters.startDate!);
      }
      if (filters.endDate) {
        txs = txs.filter((t) => t.date <= filters.endDate!);
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        txs = txs.filter(
          (t) =>
            t.description.toLowerCase().includes(term) ||
            (t.notes && t.notes.toLowerCase().includes(term))
        );
      }
    }

    // Sort chronologically (most recent first)
    txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    const categories = await this.catRepo.findAllForUser(userId);
    const accounts = await this.accRepo.findByUserId(userId);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const accMap = new Map(accounts.map((a) => [a.id, a]));

    return txs.map((t) => {
      const cat = catMap.get(t.categoryId);
      const acc = accMap.get(t.accountId);
      return {
        ...t,
        category: cat
          ? {
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              type: cat.type,
            }
          : undefined,
        account: acc
          ? {
              id: acc.id,
              name: acc.name,
              type: acc.type,
              currency: acc.currency,
            }
          : undefined,
      };
    });
  }

  async findById(id: string, userId: string): Promise<PopulatedTransaction> {
    const tx = await this.txRepo.findById(id);
    if (!tx || tx.userId !== userId) {
      throw new AppError(404, 'Movimiento no encontrado.');
    }

    const cat = await this.catRepo.findById(tx.categoryId);
    const acc = await this.accRepo.findById(tx.accountId);

    return {
      ...tx,
      category: cat
        ? {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
          }
        : undefined,
      account: acc
        ? {
            id: acc.id,
            name: acc.name,
            type: acc.type,
            currency: acc.currency,
          }
        : undefined,
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto
  ): Promise<PopulatedTransaction> {
    const existing = await this.txRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Movimiento no encontrado.');
    }

    const newAmount = dto.amount !== undefined ? dto.amount : existing.amount;
    const newType = dto.type !== undefined ? dto.type : existing.type;
    const targetAccountId = dto.accountId !== undefined ? dto.accountId : existing.accountId;

    if (newAmount <= 0) {
      throw new AppError(400, 'El monto del movimiento debe ser mayor que 0.');
    }

    // Check target account exists and belongs to user
    const targetAccount = await this.accRepo.findById(targetAccountId);
    if (!targetAccount || targetAccount.userId !== userId) {
      throw new AppError(404, 'La cuenta seleccionada no existe o no te pertenece.');
    }

    // Verify category if changed
    if (dto.categoryId) {
      const cat = await this.catRepo.findById(dto.categoryId);
      if (!cat) {
        throw new AppError(404, 'La categoría seleccionada no existe.');
      }
    }

    // Recalculate balance consistently:
    // 1. Revert previous transaction impact on old account
    const oldDelta = existing.type === 'INCOME' ? -existing.amount : +existing.amount;
    await this.accRepo.updateBalance(existing.accountId, oldDelta);

    // 2. Apply new transaction impact on target account
    const newDelta = newType === 'INCOME' ? +newAmount : -newAmount;
    const updatedTargetAccount = await this.accRepo.updateBalance(targetAccountId, newDelta);

    // 3. Update transaction record
    const updated = await this.txRepo.update(id, {
      ...dto,
      amount: newAmount,
      type: newType,
      accountId: targetAccountId,
    });

    if (!updated) {
      throw new AppError(500, 'Error al actualizar el movimiento.');
    }

    const cat = await this.catRepo.findById(updated.categoryId);

    return {
      ...updated,
      category: cat
        ? {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
          }
        : undefined,
      account: updatedTargetAccount
        ? {
            id: updatedTargetAccount.id,
            name: updatedTargetAccount.name,
            type: updatedTargetAccount.type,
            currency: updatedTargetAccount.currency,
          }
        : undefined,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.txRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Movimiento no encontrado.');
    }

    // Revert balance impact on account:
    // If it was INCOME: subtracting it (-amount)
    // If it was EXPENSE: refunding it (+amount)
    const revertDelta = existing.type === 'INCOME' ? -existing.amount : +existing.amount;
    await this.accRepo.updateBalance(existing.accountId, revertDelta);

    await this.txRepo.delete(id);
  }

  async getSummary(userId: string): Promise<FinancialSummary> {
    const txs = await this.txRepo.findByUserId(userId);
    const accounts = await this.accRepo.findByUserId(userId);
    const categories = await this.catRepo.findAllForUser(userId);

    const catMap = new Map(categories.map((c) => [c.id, c]));

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = new Map<
      string,
      { categoryId: string; total: number; count: number; type: 'INCOME' | 'EXPENSE' }
    >();

    for (const t of txs) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }

      const mapKey = `${t.categoryId}_${t.type}`;
      const existingCat = categoryTotals.get(mapKey) || {
        categoryId: t.categoryId,
        total: 0,
        count: 0,
        type: t.type,
      };
      existingCat.total += t.amount;
      existingCat.count += 1;
      categoryTotals.set(mapKey, existingCat);
    }

    const currentBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const categoryBreakdown = Array.from(categoryTotals.values()).map(
      (data) => {
        const cat = catMap.get(data.categoryId);
        const baseTotal = data.type === 'INCOME' ? totalIncome : totalExpenses;
        const percentage = baseTotal > 0 ? Math.min(Math.round((data.total / baseTotal) * 100), 100) : 0;

        return {
          categoryId: data.categoryId,
          categoryName: cat ? cat.name : 'Sin categoría',
          categoryColor: cat ? cat.color : '#6B7280',
          categoryIcon: cat ? cat.icon : 'CircleDollarSign',
          type: data.type,
          total: Math.round(data.total * 100) / 100,
          count: data.count,
          percentage,
        };
      }
    );

    return {
      currentBalance: Math.round(currentBalance * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      transactionsCount: txs.length,
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.total - a.total),
    };
  }
}

export const transactionService = new TransactionService();
