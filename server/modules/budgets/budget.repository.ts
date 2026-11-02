import { BudgetModel, Budget, BudgetPeriod } from './budget.model';

function mapDocToBudget(doc: any): Budget {
  return {
    id: doc._id?.toString() || doc.id,
    userId: doc.userId,
    categoryId: doc.categoryId,
    name: doc.name,
    limitAmount:
      typeof doc.limitAmount === 'number'
        ? Math.round(doc.limitAmount * 100) / 100
        : 0,
    period: doc.period as BudgetPeriod,
    startDate: doc.startDate,
    endDate: doc.endDate,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

export class BudgetRepository {
  async findByUserId(userId: string): Promise<Budget[]> {
    const docs = await BudgetModel.find({ userId })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();
    return docs.map(mapDocToBudget);
  }

  async findById(id: string): Promise<Budget | null> {
    const doc = await BudgetModel.findById(id).lean();
    return doc ? mapDocToBudget(doc) : null;
  }

  async findByCategoryIdAndDate(
    userId: string,
    categoryId: string,
    date: string
  ): Promise<Budget[]> {
    const docs = await BudgetModel.find({
      userId,
      categoryId,
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).lean();
    return docs.map(mapDocToBudget);
  }

  async create(data: {
    userId: string;
    categoryId: string;
    name?: string;
    limitAmount: number;
    period: BudgetPeriod;
    startDate: string;
    endDate: string;
  }): Promise<Budget> {
    const created = await BudgetModel.create({
      userId: data.userId,
      categoryId: data.categoryId,
      name: data.name?.trim() || undefined,
      limitAmount: Math.round(data.limitAmount * 100) / 100,
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    return mapDocToBudget(created.toObject());
  }

  async update(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    const docUpdates: Record<string, any> = {
      ...updates,
      updatedAt: new Date(),
    };
    delete docUpdates.id;
    delete docUpdates._id;

    if (typeof docUpdates.limitAmount === 'number') {
      docUpdates.limitAmount = Math.round(docUpdates.limitAmount * 100) / 100;
    }

    const updated = await BudgetModel.findByIdAndUpdate(id, docUpdates, {
      new: true,
    }).lean();

    return updated ? mapDocToBudget(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await BudgetModel.findByIdAndDelete(id);
    return Boolean(res);
  }
}

export const budgetRepository = new BudgetRepository();
