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
  destinationAccount?: {
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
  totalTransfers: number;
  transactionsCount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
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

    let defaultAcc = await this.accRepo.findDefaultByUserId(userId);
    if (!defaultAcc) {
      const userAccounts = await this.accRepo.findByUserId(userId);
      defaultAcc = userAccounts[0] || null;
    }

    if (!defaultAcc) {
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
    const originAccount = await this.resolveAccount(userId, dto.accountId);

    if (dto.amount <= 0) {
      throw new AppError(400, 'El monto del movimiento debe ser mayor que 0.');
    }

    // Verify category exists
    const category = await this.catRepo.findById(dto.categoryId);
    if (!category) {
      throw new AppError(404, 'La categoría seleccionada no existe.');
    }

    let destinationAccount: any = null;

    if (dto.type === 'TRANSFER') {
      if (!dto.destinationAccountId) {
        throw new AppError(400, 'Debe especificar una cuenta de destino para la transferencia.');
      }
      if (dto.destinationAccountId === originAccount.id) {
        throw new AppError(400, 'La cuenta de destino no puede ser igual a la cuenta de origen.');
      }

      destinationAccount = await this.accRepo.findById(dto.destinationAccountId);
      if (!destinationAccount || destinationAccount.userId !== userId) {
        throw new AppError(404, 'La cuenta de destino seleccionada no existe o no te pertenece.');
      }

      const destAmount = dto.destinationAmount ?? dto.amount;

      // 1. Deduct from origin account
      await this.accRepo.updateBalance(originAccount.id, -dto.amount);
      // 2. Add to destination account
      destinationAccount = await this.accRepo.updateBalance(destinationAccount.id, destAmount);
    } else {
      // INCOME or EXPENSE
      const delta = dto.type === 'INCOME' ? dto.amount : -dto.amount;
      await this.accRepo.updateBalance(originAccount.id, delta);
    }

    const tx = await this.txRepo.create({
      userId,
      accountId: originAccount.id,
      categoryId: category.id,
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
      date: dto.date,
      recurrence: dto.recurrence,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
      destinationAccountId: dto.destinationAccountId,
      destinationAmount: dto.destinationAmount,
    });

    const refreshedOrigin = await this.accRepo.findById(originAccount.id);

    return {
      ...tx,
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      },
      account: refreshedOrigin
        ? {
            id: refreshedOrigin.id,
            name: refreshedOrigin.name,
            type: refreshedOrigin.type,
            currency: refreshedOrigin.currency,
          }
        : undefined,
      destinationAccount: destinationAccount
        ? {
            id: destinationAccount.id,
            name: destinationAccount.name,
            type: destinationAccount.type,
            currency: destinationAccount.currency,
          }
        : undefined,
    };
  }

  async findAll(
    userId: string,
    filters?: TransactionFilterDto
  ): Promise<PopulatedTransaction[]> {
    let txs = await this.txRepo.findByUserId(userId);

    if (filters) {
      if (filters.type) {
        txs = txs.filter((t) => t.type === filters.type);
      }
      if (filters.categoryId) {
        txs = txs.filter((t) => t.categoryId === filters.categoryId);
      }
      if (filters.accountId) {
        txs = txs.filter((t) => t.accountId === filters.accountId || t.destinationAccountId === filters.accountId);
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

    txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    const categories = await this.catRepo.findAllForUser(userId);
    const accounts = await this.accRepo.findByUserId(userId);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const accMap = new Map(accounts.map((a) => [a.id, a]));

    return txs.map((t) => {
      const cat = catMap.get(t.categoryId);
      const acc = accMap.get(t.accountId);
      const destAcc = t.destinationAccountId ? accMap.get(t.destinationAccountId) : undefined;

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
        destinationAccount: destAcc
          ? {
              id: destAcc.id,
              name: destAcc.name,
              type: destAcc.type,
              currency: destAcc.currency,
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
    const destAcc = tx.destinationAccountId ? await this.accRepo.findById(tx.destinationAccountId) : undefined;

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
      destinationAccount: destAcc
        ? {
            id: destAcc.id,
            name: destAcc.name,
            type: destAcc.type,
            currency: destAcc.currency,
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
    const targetDestAccountId = dto.destinationAccountId !== undefined ? dto.destinationAccountId : existing.destinationAccountId;
    const targetDestAmount = dto.destinationAmount !== undefined ? dto.destinationAmount : existing.destinationAmount;

    // 1. Revert existing impact
    if (existing.type === 'TRANSFER') {
      await this.accRepo.updateBalance(existing.accountId, existing.amount);
      if (existing.destinationAccountId) {
        const destAmt = existing.destinationAmount ?? existing.amount;
        await this.accRepo.updateBalance(existing.destinationAccountId, -destAmt);
      }
    } else {
      const revertDelta = existing.type === 'INCOME' ? -existing.amount : +existing.amount;
      await this.accRepo.updateBalance(existing.accountId, revertDelta);
    }

    // 2. Apply new impact
    if (newType === 'TRANSFER') {
      if (!targetDestAccountId || targetDestAccountId === targetAccountId) {
        throw new AppError(400, 'Cuenta de destino inválida para la transferencia.');
      }
      await this.accRepo.updateBalance(targetAccountId, -newAmount);
      await this.accRepo.updateBalance(targetDestAccountId, targetDestAmount ?? newAmount);
    } else {
      const applyDelta = newType === 'INCOME' ? +newAmount : -newAmount;
      await this.accRepo.updateBalance(targetAccountId, applyDelta);
    }

    // 3. Persist update
    const updated = await this.txRepo.update(id, {
      ...dto,
      amount: newAmount,
      type: newType,
      accountId: targetAccountId,
      destinationAccountId: targetDestAccountId,
      destinationAmount: targetDestAmount,
    });

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.txRepo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new AppError(404, 'Movimiento no encontrado.');
    }

    if (existing.type === 'TRANSFER') {
      // Revert origin: add back deducted amount
      await this.accRepo.updateBalance(existing.accountId, existing.amount);
      // Revert destination: deduct received amount
      if (existing.destinationAccountId) {
        const destAmount = existing.destinationAmount ?? existing.amount;
        await this.accRepo.updateBalance(existing.destinationAccountId, -destAmount);
      }
    } else {
      const revertDelta = existing.type === 'INCOME' ? -existing.amount : +existing.amount;
      await this.accRepo.updateBalance(existing.accountId, revertDelta);
    }

    await this.txRepo.delete(id);
  }

  async getSummary(userId: string): Promise<FinancialSummary> {
    const txs = await this.txRepo.findByUserId(userId);
    const accounts = await this.accRepo.findByUserId(userId);
    const categories = await this.catRepo.findAllForUser(userId);

    const catMap = new Map(categories.map((c) => [c.id, c]));

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;
    const categoryTotals = new Map<
      string,
      { categoryId: string; total: number; count: number; type: 'INCOME' | 'EXPENSE' | 'TRANSFER' }
    >();

    for (const t of txs) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else if (t.type === 'EXPENSE') {
        totalExpenses += t.amount;
      } else if (t.type === 'TRANSFER') {
        totalTransfers += t.amount;
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
      totalTransfers: Math.round(totalTransfers * 100) / 100,
      transactionsCount: txs.length,
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.total - a.total),
    };
  }
}

export const transactionService = new TransactionService();
