import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserModel } from '../modules/auth/user.model';
import { AccountModel } from '../modules/accounts/account.model';
import { CategoryModel } from '../modules/categories/category.model';
import { TransactionModel } from '../modules/transactions/transaction.model';
import { DEFAULT_SYSTEM_CATEGORIES } from './seed-categories';

const LOCAL_DB_FILE = path.resolve(process.cwd(), 'server/data/finanapp-db.json');

export async function runMongoMigrationAndSeeds(): Promise<void> {
  const usersCount = await UserModel.countDocuments();
  const categoriesCount = await CategoryModel.countDocuments();

  // 1. Check if we need to migrate from local storage file
  if (usersCount === 0 && fs.existsSync(LOCAL_DB_FILE)) {
    try {
      console.log('📦 [MongoDB Migration] Reading existing local JSON storage to migrate into MongoDB...');
      const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      const data = JSON.parse(raw);

      // Migrate Categories
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        for (const cat of data.categories) {
          await CategoryModel.findByIdAndUpdate(
            cat.id,
            {
              _id: cat.id,
              userId: cat.userId || null,
              name: cat.name,
              type: cat.type,
              icon: cat.icon,
              color: cat.color,
              budgetLimit: cat.budgetLimit,
              createdAt: cat.createdAt || new Date().toISOString(),
              updatedAt: cat.updatedAt || new Date().toISOString(),
            },
            { upsert: true }
          );
        }
        console.log(`✅ [MongoDB Migration] Migrated ${data.categories.length} categories.`);
      }

      // Migrate Users
      if (Array.isArray(data.users) && data.users.length > 0) {
        for (const u of data.users) {
          await UserModel.findByIdAndUpdate(
            u.id,
            {
              _id: u.id,
              name: u.name,
              email: u.email.toLowerCase(),
              passwordHash: u.passwordHash,
              failedLoginAttempts: u.failedLoginAttempts || 0,
              lockUntil: u.lockUntil || null,
              createdAt: u.createdAt || new Date().toISOString(),
              updatedAt: u.updatedAt || new Date().toISOString(),
            },
            { upsert: true }
          );
        }
        console.log(`✅ [MongoDB Migration] Migrated ${data.users.length} users.`);
      }

      // Migrate Accounts
      if (Array.isArray(data.accounts) && data.accounts.length > 0) {
        for (const acc of data.accounts) {
          await AccountModel.findByIdAndUpdate(
            acc.id,
            {
              _id: acc.id,
              userId: acc.userId,
              name: acc.name,
              type: acc.type || 'CASH',
              balance: acc.balance || 0,
              currency: acc.currency || 'USD',
              isDefault: acc.isDefault || false,
              createdAt: acc.createdAt || new Date().toISOString(),
              updatedAt: acc.updatedAt || new Date().toISOString(),
            },
            { upsert: true }
          );
        }
        console.log(`✅ [MongoDB Migration] Migrated ${data.accounts.length} accounts.`);
      }

      // Migrate Transactions
      if (Array.isArray(data.transactions) && data.transactions.length > 0) {
        for (const tx of data.transactions) {
          await TransactionModel.findByIdAndUpdate(
            tx.id,
            {
              _id: tx.id,
              userId: tx.userId,
              accountId: tx.accountId,
              categoryId: tx.categoryId,
              amount: tx.amount,
              type: tx.type,
              description: tx.description,
              date: tx.date,
              recurrence: tx.recurrence || 'NONE',
              paymentMethod: tx.paymentMethod,
              notes: tx.notes,
              createdAt: tx.createdAt || new Date().toISOString(),
              updatedAt: tx.updatedAt || new Date().toISOString(),
            },
            { upsert: true }
          );
        }
        console.log(`✅ [MongoDB Migration] Migrated ${data.transactions.length} transactions.`);
      }

      console.log('🎉 [MongoDB Migration] Local storage data successfully migrated to MongoDB!');
      console.log('ℹ️ [MongoDB Migration] Note: The local file server/data/finanapp-db.json has been preserved as requested.');
      return;
    } catch (err) {
      console.error('⚠️ [MongoDB Migration] Error during migration from JSON, falling back to seed defaults:', err);
    }
  }

  // 2. Fallback seeds if fresh database with no JSON or migration
  if (categoriesCount === 0) {
    console.log('🌱 [MongoDB] Seeding default system categories in MongoDB...');
    const now = new Date().toISOString();
    const categoriesToSeed = DEFAULT_SYSTEM_CATEGORIES.map((cat, idx) => ({
      ...cat,
      _id: `cat-system-${idx + 1}`,
      userId: null,
      createdAt: now,
      updatedAt: now,
    }));
    await CategoryModel.insertMany(categoriesToSeed);
    console.log(`✅ [MongoDB] Seeded ${categoriesToSeed.length} default categories.`);
  }

  const currentUsers = await UserModel.countDocuments();
  if (currentUsers === 0) {
    console.log('🌱 [MongoDB] Seeding default demo user and account in MongoDB...');
    const now = new Date().toISOString();
    const demoUserId = 'user-demo-001';
    await UserModel.create({
      _id: demoUserId,
      name: 'Usuario Demo',
      email: 'demo@finanapp.com',
      passwordHash: bcrypt.hashSync('Demo123456', 10),
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: now,
      updatedAt: now,
    });

    await AccountModel.create({
      _id: 'acc-demo-001',
      userId: demoUserId,
      name: 'Cuenta Principal',
      type: 'CASH',
      balance: 1500.0,
      currency: 'USD',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log('✅ [MongoDB] Demo user and account seeded in MongoDB.');
  }
}
