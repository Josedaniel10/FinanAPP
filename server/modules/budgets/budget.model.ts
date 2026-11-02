import { Schema, model, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'YEARLY' | 'CUSTOM';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  name?: string;
  limitAmount: number;
  period: BudgetPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDocument extends Omit<Budget, 'id'>, Document<string> {
  _id: string;
}

const budgetSchema = new Schema<BudgetDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: undefined,
    },
    limitAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    period: {
      type: String,
      enum: ['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM'],
      default: 'MONTHLY',
    },
    startDate: {
      type: String,
      required: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      index: true,
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

// Compound indexes for user queries
budgetSchema.index({ userId: 1, categoryId: 1 });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const BudgetModel: Model<BudgetDocument> = model<BudgetDocument>(
  'Budget',
  budgetSchema
);
