import {
  TransactionModel,
  Transaction,
  TransactionType,
} from './transaction.model.js';

function mapDocToTransaction(doc: any): Transaction {
  return {
    id: doc._id?.toString() || doc.id,
    userId: doc.userId,
    accountId: doc.accountId,
    categoryId: doc.categoryId,
    amount: typeof doc.amount === 'number' ? Math.round(doc.amount * 100) / 100 : 0,
    type: doc.type as TransactionType,
    description: doc.description,
    date: doc.date,
    recurrence: doc.recurrence,
    paymentMethod: doc.paymentMethod,
    notes: doc.notes,
    destinationAccountId: doc.destinationAccountId,
    destinationAmount: doc.destinationAmount,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class TransactionRepository {
  async findByUserId(userId: string): Promise<Transaction[]> {
    const docs = await TransactionModel.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(mapDocToTransaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).lean();
    return doc ? mapDocToTransaction(doc) : null;
  }

  async create(txData: {
    userId: string;
    accountId: string;
    categoryId: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: string;
    recurrence?: Transaction['recurrence'];
    paymentMethod?: Transaction['paymentMethod'];
    notes?: string;
    destinationAccountId?: string;
    destinationAmount?: number;
  }): Promise<Transaction> {
    const created = await TransactionModel.create({
      userId: txData.userId,
      accountId: txData.accountId,
      categoryId: txData.categoryId,
      amount: Math.round(txData.amount * 100) / 100,
      type: txData.type,
      description: txData.description.trim(),
      date: txData.date,
      recurrence: txData.recurrence || 'NONE',
      paymentMethod: txData.paymentMethod,
      notes: txData.notes?.trim() || undefined,
      destinationAccountId: txData.destinationAccountId,
      destinationAmount: txData.destinationAmount
        ? Math.round(txData.destinationAmount * 100) / 100
        : undefined,
    });
    return mapDocToTransaction(created.toObject());
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const docUpdates: Record<string, any> = {
      ...updates,
      updatedAt: new Date(),
    };
    delete docUpdates.id;
    delete docUpdates._id;

    if (typeof docUpdates.amount === 'number') {
      docUpdates.amount = Math.round(docUpdates.amount * 100) / 100;
    }
    if (typeof docUpdates.destinationAmount === 'number') {
      docUpdates.destinationAmount = Math.round(docUpdates.destinationAmount * 100) / 100;
    }

    const updated = await TransactionModel.findByIdAndUpdate(id, docUpdates, {
      new: true,
    }).lean();

    return updated ? mapDocToTransaction(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await TransactionModel.findByIdAndDelete(id);
    return Boolean(res);
  }
}

export const transactionRepository = new TransactionRepository();
