import { Schema, model, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';

export type AccountType = 'CASH' | 'BANK' | 'SAVINGS' | 'CREDIT' | 'OTHER';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDocument extends Omit<Account, 'id'>, Document<string> {
  _id: string;
}

const accountSchema = new Schema<AccountDocument>(
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
    type: {
      type: String,
      enum: ['CASH', 'BANK', 'SAVINGS', 'CREDIT', 'OTHER'],
      default: 'CASH',
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    isDefault: {
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

accountSchema.index({ userId: 1, isDefault: 1 });

export const AccountModel: Model<AccountDocument> =
  model<AccountDocument>('Account', accountSchema);
