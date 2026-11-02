import { UserModel } from './user.model';
import { User } from './auth.types';

function mapDocToUser(doc: any): User {
  return {
    id: doc._id?.toString() || doc.id,
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    failedLoginAttempts: doc.failedLoginAttempts ?? 0,
    lockUntil: doc.lockUntil ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).lean();
    return doc ? mapDocToUser(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    return doc ? mapDocToUser(doc) : null;
  }

  async create(userData: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    const created = await UserModel.create({
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      passwordHash: userData.passwordHash,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    return mapDocToUser(created.toObject());
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const updated = await UserModel.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();
    return updated ? mapDocToUser(updated) : null;
  }

  async updateFailedAttempts(
    id: string,
    attempts: number,
    lockUntil: number | null
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: {
        failedLoginAttempts: attempts,
        lockUntil: lockUntil,
      },
    });
  }

  async resetFailedAttempts(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  }
}

export const authRepository = new AuthRepository();
