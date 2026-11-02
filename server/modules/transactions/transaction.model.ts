import { Schema, model, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type PaymentMethodType =
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'TRANSFER'
  | 'OTHER';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string; // ISO 8601 string YYYY-MM-DD
  recurrence?: RecurrenceType;
  paymentMethod?: PaymentMethodType;
  notes?: string;
  destinationAccountId?: string;
  destinationAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDocument
  extends Omit<Transaction, 'id'>,
    Document<string> {
  _id: string;
}

const transactionSchema = new Schema<TransactionDocument>(
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
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    recurrence: {
      type: String,
      enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
      default: 'NONE',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER', 'OTHER'],
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      default: undefined,
    },
    destinationAccountId: {
      type: String,
      default: undefined,
      index: true,
    },
    destinationAmount: {
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

// Performance compound indexes for transaction history and aggregation
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, accountId: 1 });

export const TransactionModel: Model<TransactionDocument> =
  model<TransactionDocument>('Transaction', transactionSchema);
