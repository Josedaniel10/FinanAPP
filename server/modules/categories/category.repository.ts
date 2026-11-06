import { CategoryModel, Category, CategoryType } from './category.model.js';

function mapDocToCategory(doc: any): Category {
  return {
    id: doc._id?.toString() || doc.id,
    userId: doc.userId || null,
    name: doc.name,
    type: doc.type as CategoryType,
    icon: doc.icon,
    color: doc.color,
    budgetLimit: doc.budgetLimit,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class CategoryRepository {
  async findAllForUser(userId: string): Promise<Category[]> {
    const docs = await CategoryModel.find({
      $or: [{ userId: null }, { userId }],
    })
      .sort({ type: 1, name: 1 })
      .lean();
    return docs.map(mapDocToCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const doc = await CategoryModel.findById(id).lean();
    return doc ? mapDocToCategory(doc) : null;
  }

  async findByNameAndType(
    userId: string,
    name: string,
    type: CategoryType,
    excludeId?: string
  ): Promise<Category | null> {
    const filter: Record<string, any> = {
      $or: [{ userId: null }, { userId }],
      type,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const doc = await CategoryModel.findOne(filter).lean();
    return doc ? mapDocToCategory(doc) : null;
  }

  async create(categoryData: {
    userId: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    budgetLimit?: number;
  }): Promise<Category> {
    const created = await CategoryModel.create({
      userId: categoryData.userId,
      name: categoryData.name.trim(),
      type: categoryData.type,
      icon: categoryData.icon || 'Tag',
      color: categoryData.color || '#059669',
      budgetLimit: categoryData.budgetLimit,
    });
    return mapDocToCategory(created.toObject());
  }

  async update(id: string, updates: Partial<Category>): Promise<Category | null> {
    const docUpdates: Record<string, any> = {
      ...updates,
      updatedAt: new Date(),
    };
    delete docUpdates.id;
    delete docUpdates._id;
    delete docUpdates.userId; // user ownership cannot be transferred

    if (docUpdates.name) {
      docUpdates.name = docUpdates.name.trim();
    }

    const updated = await CategoryModel.findByIdAndUpdate(id, docUpdates, {
      new: true,
    }).lean();

    return updated ? mapDocToCategory(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await CategoryModel.findByIdAndDelete(id);
    return Boolean(res);
  }
}

export const categoryRepository = new CategoryRepository();
