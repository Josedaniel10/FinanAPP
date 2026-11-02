import { Schema, model, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string | null; // null for system predefined categories
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  budgetLimit?: number; // Optional limit for expense category budgets
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDocument extends Omit<Category, 'id'>, Document<string> {
  _id: string;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: true,
      index: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    budgetLimit: {
      type: Number,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

categorySchema.index({ userId: 1, type: 1 });

export const CategoryModel: Model<CategoryDocument> =
  model<CategoryDocument>('Category', categorySchema);
