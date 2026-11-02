import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { authRepository } from '../auth/auth.repository';
import { AccountModel } from '../accounts/account.model';
import { TransactionModel } from '../transactions/transaction.model';
import { UserModel } from '../auth/user.model';
import { AppError } from '../../errors/app-error';

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
