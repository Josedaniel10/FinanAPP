import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { authRepository } from '../auth/auth.repository.js';
import { AccountModel } from '../accounts/account.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { BudgetModel } from '../budgets/budget.model.js';
import { SavingsGoalModel } from '../savings/savings.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { UserModel } from '../auth/user.model.js';
import { AppError } from '../../errors/app-error.js';

export class AdminController {
  async getUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await authRepository.findAll();
    // Strip passwords and enhance with activity stats
    const safeUsers = await Promise.all(
      users.map(async (u) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _, ...safe } = u;
        const [accountCount, transactionCount] = await Promise.all([
          AccountModel.countDocuments({ userId: u.id }),
          TransactionModel.countDocuments({ userId: u.id }),
        ]);
        return {
          ...safe,
          accountCount,
          transactionCount,
          isLocked: Boolean(u.lockUntil && u.lockUntil > Date.now()),
        };
      })
    );

    res.json({
      success: true,
      data: safeUsers,
    });
  }

  async unlockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado.');
    }

    await authRepository.resetFailedAttempts(userId);

    res.json({
      success: true,
      message: `La cuenta de ${user.email} ha sido desbloqueada exitosamente.`,
    });
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'USER'].includes(role)) {
      throw new AppError(400, 'Rol inválido. Debe ser ADMIN o USER.');
    }

    const targetUser = await authRepository.findById(userId);
    if (!targetUser) {
      throw new AppError(404, 'Usuario no encontrado.');
    }

    // Strict rule: demo@finanapp.com is the sole administrator
    if (role === 'ADMIN' && targetUser.email !== 'demo@finanapp.com') {
      throw new AppError(
        403,
        'demo@finanapp.com es el administrador único del sistema. No está permitido asignar administradores adicionales.'
      );
    }

    if (targetUser.email === 'demo@finanapp.com' && role !== 'ADMIN') {
      throw new AppError(
        400,
        'No es posible revocar el rol de Administrador a demo@finanapp.com.'
      );
    }

    // Prevent revoking admin from own account
    if (req.user?.id === userId && role !== 'ADMIN') {
      throw new AppError(400, 'No puedes revocarte a ti mismo el rol de Administrador.');
    }

    const updated = await authRepository.update(userId, { role });
    if (!updated) {
      throw new AppError(404, 'Usuario no encontrado.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = updated;

    res.json({
      success: true,
      message: `Rol actualizado a ${role} para ${updated.email}.`,
      data: safeUser,
    });
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const targetUser = await authRepository.findById(userId);
    if (!targetUser) {
      throw new AppError(404, 'Usuario no encontrado.');
    }

    if (targetUser.email === 'demo@finanapp.com' || targetUser.id === req.user?.id) {
      throw new AppError(
        400,
        'No es posible eliminar la cuenta del administrador principal del sistema.'
      );
    }

    // Cascade delete all records belonging to this user
    await Promise.all([
      TransactionModel.deleteMany({ userId }),
      AccountModel.deleteMany({ userId }),
      BudgetModel.deleteMany({ userId }),
      SavingsGoalModel.deleteMany({ userId }),
      CategoryModel.deleteMany({ userId }),
      UserModel.findByIdAndDelete(userId),
    ]);

    res.json({
      success: true,
      message: `Usuario ${targetUser.email} y todos sus datos asociados fueron eliminados permanentemente.`,
    });
  }

  async getSystemStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const [totalUsers, totalAccounts, totalTransactions, adminCount] = await Promise.all([
      UserModel.countDocuments(),
      AccountModel.countDocuments(),
      TransactionModel.countDocuments(),
      UserModel.countDocuments({ role: 'ADMIN' }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAccounts,
        totalTransactions,
        adminCount,
      },
    });
  }
}

export const adminController = new AdminController();
