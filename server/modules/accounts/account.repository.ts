import { AccountModel, Account, AccountType } from './account.model';

function mapDocToAccount(doc: any): Account {
  return {
    id: doc._id?.toString() || doc.id,
    userId: doc.userId,
    name: doc.name,
    type: doc.type as AccountType,
    balance: typeof doc.balance === 'number' ? Math.round(doc.balance * 100) / 100 : 0,
    currency: doc.currency || 'USD',
    isDefault: Boolean(doc.isDefault),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class AccountRepository {
  async create(accountData: {
    userId: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    isDefault: boolean;
  }): Promise<Account> {
    const created = await AccountModel.create({
      userId: accountData.userId,
      name: accountData.name.trim(),
      type: accountData.type,
      balance: Math.round(accountData.balance * 100) / 100,
      currency: accountData.currency || 'USD',
      isDefault: accountData.isDefault,
    });
    return mapDocToAccount(created.toObject());
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const docs = await AccountModel.find({ userId }).sort({ createdAt: 1 }).lean();
    return docs.map(mapDocToAccount);
  }

  async findDefaultByUserId(userId: string): Promise<Account | null> {
    const doc = await AccountModel.findOne({ userId, isDefault: true }).lean();
    return doc ? mapDocToAccount(doc) : null;
  }

  async findById(id: string): Promise<Account | null> {
    const doc = await AccountModel.findById(id).lean();
    return doc ? mapDocToAccount(doc) : null;
  }

  async updateBalance(id: string, deltaAmount: number): Promise<Account | null> {
    // Atomic increment in MongoDB to prevent concurrency race conditions
    const updated = await AccountModel.findByIdAndUpdate(
      id,
      {
        $inc: { balance: deltaAmount },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    ).lean();

    if (!updated) return null;

    // Ensure 2 decimal rounding precision
    const roundedBalance = Math.round(updated.balance * 100) / 100;
    if (roundedBalance !== updated.balance) {
      await AccountModel.findByIdAndUpdate(id, { $set: { balance: roundedBalance } });
      updated.balance = roundedBalance;
    }

    return mapDocToAccount(updated);
  }
}

export const accountRepository = new AccountRepository();
