import bcrypt from 'bcryptjs';
import { UserModel } from '../modules/auth/user.model';
import { AccountModel } from '../modules/accounts/account.model';
import { CategoryModel } from '../modules/categories/category.model';
import { DEFAULT_SYSTEM_CATEGORIES } from './seed-categories';

export async function runDatabaseSeed(): Promise<void> {
  // 1. Seed System Categories
  const categoriesCount = await CategoryModel.countDocuments();
  if (categoriesCount === 0) {
    console.log('🌱 [MongoDB Seed] Inicializando categorías del sistema...');
    const now = new Date().toISOString();
    const categoriesToSeed = DEFAULT_SYSTEM_CATEGORIES.map((cat, idx) => ({
      _id: `cat-system-${idx + 1}`,
      userId: null,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      createdAt: now,
      updatedAt: now,
    }));
    await CategoryModel.insertMany(categoriesToSeed);
    console.log(`✅ [MongoDB Seed] ${categoriesToSeed.length} categorías del sistema sembradas.`);
  }

  // 2. Ensure Admin Demo User
  const adminEmail = 'demo@finanapp.com';
  const existingAdmin = await UserModel.findOne({ email: adminEmail });

  if (!existingAdmin) {
    console.log('🌱 [MongoDB Seed] Creando usuario Administrador inicial...');
    const adminUserId = 'user-admin-001';
    const passwordHash = bcrypt.hashSync('Demo123456', 10);

    await UserModel.create({
      _id: adminUserId,
      name: 'Administrador Demo',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    await AccountModel.create({
      _id: 'acc-admin-001',
      userId: adminUserId,
      name: 'Cuenta Principal',
      type: 'CASH',
      balance: 2500.0,
      currency: 'USD',
      isDefault: true,
    });

    console.log('✅ [MongoDB Seed] Usuario Administrador sembrado: demo@finanapp.com / Demo123456 (Rol: ADMIN)');
  } else if (existingAdmin.role !== 'ADMIN') {
    existingAdmin.role = 'ADMIN';
    await existingAdmin.save();
    console.log('✅ [MongoDB Seed] Usuario demo actualizado con rol ADMIN.');
  }
}
