import { Schema, model, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  accountId?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalDocument extends Omit<SavingsGoal, 'id'>, Document<string> {
  _id: string;
}

const savingsGoalSchema = new Schema<SavingsGoalDocument>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currentAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    targetDate: {
      type: String,
      default: undefined,
    },
    color: {
      type: String,
      default: '#10B981',
    },
    icon: {
      type: String,
      default: 'PiggyBank',
    },
    accountId: {
      type: String,
      default: undefined,
    },
    isCompleted: {
      type: Boolean,
      default: false,
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

savingsGoalSchema.index({ userId: 1, isCompleted: 1 });

export const SavingsGoalModel: Model<SavingsGoalDocument> =
  model<SavingsGoalDocument>('SavingsGoal', savingsGoalSchema);
