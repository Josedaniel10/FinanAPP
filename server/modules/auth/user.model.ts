import { Schema, model, Document, Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { User, UserRole } from './auth.types.js';

export interface UserDocument extends Omit<User, 'id'>, Document<string> {
  _id: string;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Number,
      default: null,
    },
    preferredCurrency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    excludedCategoryIds: {
      type: [String],
      default: [],
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

export const UserModel: Model<UserDocument> =
  model<UserDocument>('User', userSchema);
