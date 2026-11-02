import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User } from '../modules/auth/auth.types';
import { Account } from '../modules/accounts/account.model';
import { Category } from '../modules/categories/category.model';
import { Transaction } from '../modules/transactions/transaction.model';
import { DEFAULT_SYSTEM_CATEGORIES } from './seed-categories';

export interface DatabaseSchema {
  users: User[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
}

const DB_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DB_DIR, 'finanapp-db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    accounts: [],
    categories: [],
    transactions: [],
  };
  private isInitialized = false;
  private writeLock: Promise<void> = Promise.resolve();

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          accounts: parsed.accounts || [],
          categories: parsed.categories || [],
          transactions: parsed.transactions || [],
        };
      } catch (err) {
        console.error('Error reading database file, initializing fresh schema:', err);
        await this.persist();
      }
    } else {
      // Seed default categories
      const now = new Date().toISOString();
      this.data.categories = DEFAULT_SYSTEM_CATEGORIES.map((cat, idx) => ({
        ...cat,
        id: `cat-system-${idx + 1}`,
        createdAt: now,
        updatedAt: now,
      }));
      await this.persist();
    }

    // Seed initial demo user if no users exist
    if (this.data.users.length === 0) {
      const now = new Date().toISOString();
      const demoUserId = 'user-demo-001';
      const demoUser: User = {
        id: demoUserId,
        name: 'Usuario Demo',
        email: 'demo@finanapp.com',
        passwordHash: bcrypt.hashSync('Demo123456', 10),
        failedLoginAttempts: 0,
        lockUntil: null,
        createdAt: now,
        updatedAt: now,
      };

      const demoAccount: Account = {
        id: 'acc-demo-001',
        userId: demoUserId,
        name: 'Cuenta Principal',
        type: 'CASH',
        balance: 1500.0,
        currency: 'USD',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };

      this.data.users.push(demoUser);
      this.data.accounts.push(demoAccount);
      await this.persist();
    }

    this.isInitialized = true;
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public async persist(): Promise<void> {
    // Queue writes to ensure sequential atomic saves
    this.writeLock = this.writeLock.then(async () => {
      try {
        const tempPath = `${DB_FILE}.tmp`;
        const content = JSON.stringify(this.data, null, 2);
        await fs.promises.writeFile(tempPath, content, 'utf-8');
        await fs.promises.rename(tempPath, DB_FILE);
      } catch (err) {
        console.error('Error persisting database:', err);
        throw err;
      }
    });

    return this.writeLock;
  }
}

export const dbService = new DatabaseService();
