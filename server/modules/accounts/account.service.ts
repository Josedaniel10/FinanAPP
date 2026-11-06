import { accountRepository, AccountRepository } from './account.repository.js';
import { Account, AccountType } from './account.model.js';
import { AppError } from '../../errors/app-error.js';

export interface CreateAccountDto {
  name: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  isDefault?: boolean;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  currency?: string;
  isDefault?: boolean;
}

export class AccountService {
  constructor(private readonly repository: AccountRepository = accountRepository) {}

  async getUserAccounts(userId: string): Promise<Account[]> {
    return this.repository.findByUserId(userId);
  }

  async createAccount(userId: string, dto: CreateAccountDto): Promise<Account> {
    if (!dto.name || !dto.name.trim()) {
      throw new AppError(400, 'El nombre de la cuenta es requerido.');
    }

    if (dto.isDefault) {
      await this.repository.clearDefault(userId);
    }

    // Check if user has no accounts, make this one default
    const existing = await this.repository.findByUserId(userId);
    const isFirstAccount = existing.length === 0;

    return this.repository.create({
      userId,
      name: dto.name.trim(),
      type: dto.type || 'CASH',
      balance: dto.balance ?? 0,
      currency: dto.currency || 'USD',
      isDefault: isFirstAccount ? true : Boolean(dto.isDefault),
    });
  }

  async updateAccount(userId: string, accountId: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.repository.findById(accountId);
    if (!account || account.userId !== userId) {
      throw new AppError(404, 'Cuenta no encontrada.');
    }

    if (dto.isDefault && !account.isDefault) {
      await this.repository.clearDefault(userId);
    }

    const updated = await this.repository.update(accountId, dto);
    if (!updated) {
      throw new AppError(500, 'Error actualizando la cuenta.');
    }

    return updated;
  }

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.repository.findById(accountId);
    if (!account || account.userId !== userId) {
      throw new AppError(404, 'Cuenta no encontrada.');
    }

    const allAccounts = await this.repository.findByUserId(userId);
    if (allAccounts.length <= 1) {
      throw new AppError(400, 'No puedes eliminar tu única cuenta financiera.');
    }

    await this.repository.delete(accountId);

    // If deleted account was default, designate another as default
    if (account.isDefault) {
      const remaining = allAccounts.filter((a) => a.id !== accountId);
      if (remaining.length > 0) {
        await this.repository.update(remaining[0].id, { isDefault: true });
      }
    }
  }
}

export const accountService = new AccountService();
