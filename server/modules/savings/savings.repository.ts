import { SavingsGoalModel, SavingsGoal } from './savings.model';

function mapDocToSavingsGoal(doc: any): SavingsGoal {
  return {
    id: doc._id?.toString() || doc.id,
    userId: doc.userId,
    name: doc.name,
    targetAmount: typeof doc.targetAmount === 'number' ? Math.round(doc.targetAmount * 100) / 100 : 0,
    currentAmount: typeof doc.currentAmount === 'number' ? Math.round(doc.currentAmount * 100) / 100 : 0,
    targetDate: doc.targetDate,
    color: doc.color || '#10B981',
    icon: doc.icon || 'PiggyBank',
    accountId: doc.accountId,
    isCompleted: Boolean(doc.isCompleted),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class SavingsRepository {
  async findByUserId(userId: string): Promise<SavingsGoal[]> {
    const docs = await SavingsGoalModel.find({ userId }).sort({ isCompleted: 1, createdAt: -1 }).lean();
    return docs.map(mapDocToSavingsGoal);
  }

  async findById(id: string): Promise<SavingsGoal | null> {
    const doc = await SavingsGoalModel.findById(id).lean();
    return doc ? mapDocToSavingsGoal(doc) : null;
  }

  async create(data: {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    color?: string;
    icon?: string;
    accountId?: string;
  }): Promise<SavingsGoal> {
    const current = data.currentAmount ?? 0;
    const isCompleted = current >= data.targetAmount;
    const created = await SavingsGoalModel.create({
      userId: data.userId,
      name: data.name.trim(),
      targetAmount: Math.round(data.targetAmount * 100) / 100,
      currentAmount: Math.round(current * 100) / 100,
      targetDate: data.targetDate,
      color: data.color || '#10B981',
      icon: data.icon || 'PiggyBank',
      accountId: data.accountId,
      isCompleted,
    });
    return mapDocToSavingsGoal(created.toObject());
  }

  async update(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | null> {
    const docUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
    delete docUpdates.id;
    delete docUpdates._id;

    if (typeof docUpdates.targetAmount === 'number') {
      docUpdates.targetAmount = Math.round(docUpdates.targetAmount * 100) / 100;
    }
    if (typeof docUpdates.currentAmount === 'number') {
      docUpdates.currentAmount = Math.round(docUpdates.currentAmount * 100) / 100;
    }

    const updated = await SavingsGoalModel.findByIdAndUpdate(id, docUpdates, { new: true }).lean();
    return updated ? mapDocToSavingsGoal(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await SavingsGoalModel.findByIdAndDelete(id);
    return Boolean(res);
  }
}

export const savingsRepository = new SavingsRepository();
