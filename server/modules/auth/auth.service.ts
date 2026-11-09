import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { accountRepository } from '../accounts/account.repository.js';
import { authRepository, AuthRepository } from './auth.repository.js';
import { RegisterDto, LoginDto } from './auth.schema.js';
import { AuthSessionResponse, UserWithoutPassword, User } from './auth.types.js';

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  private generateToken(userId: string, email: string, role: string): string {
    const secret = env.JWT_SECRET || 'finanapp_super_secret_jwt_key_2026_scrum';
    // 7 days in numeric seconds (60 * 60 * 24 * 7)
    const expiresInSeconds = 604800;

    return jwt.sign({ userId, email, role }, secret, {
      expiresIn: expiresInSeconds,
    });
  }

  async register(dto: RegisterDto): Promise<AuthSessionResponse> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new AppError(
        409,
        'Ya existe una cuenta registrada con este correo electrónico.'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.repository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: 'USER',
      preferredCurrency: 'USD',
      hasCompletedOnboarding: false,
    });

    // Auto-create default account for the new user
    await accountRepository.create({
      userId: user.id,
      name: 'Cuenta Principal',
      type: 'CASH',
      balance: 0,
      currency: 'USD',
      isDefault: true,
    });

    const token = this.generateToken(user.id, user.email, user.role);

    // Safe user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthSessionResponse> {
    const user = await this.repository.findByEmail(dto.email);
    if (!user) {
      // Intentionally avoid leaking email existence
      throw new AppError(401, 'Credenciales inválidas. Verifique su correo y contraseña.');
    }

    const now = Date.now();

    // Check if account is currently locked
    if (user.lockUntil && user.lockUntil > now) {
      const minutesRemaining = Math.max(
        1,
        Math.ceil((user.lockUntil - now) / (60 * 1000))
      );
      throw new AppError(
        423,
        `Cuenta bloqueada temporalmente por 3 intentos fallidos consecutivos. Intente nuevamente en ${minutesRemaining} minuto(s).`,
        {
          lockUntil: user.lockUntil,
          minutesRemaining,
        }
      );
    }

    // Check if lock expired, if so, reset counter baseline
    const isLockExpired = Boolean(user.lockUntil && user.lockUntil <= now);
    const currentAttempts = isLockExpired ? 0 : user.failedLoginAttempts;

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      const newAttempts = currentAttempts + 1;
      const MAX_ATTEMPTS = 3;
      const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = now + LOCK_DURATION_MS;
        await this.repository.updateFailedAttempts(user.id, newAttempts, lockUntil);
        throw new AppError(
          423,
          'Ha superado el límite de 3 intentos fallidos consecutivos. Su cuenta ha sido bloqueada temporalmente por 15 minutos por motivos de seguridad.',
          {
            attemptsRemaining: 0,
            lockUntil,
            minutesRemaining: 15,
          }
        );
      } else {
        await this.repository.updateFailedAttempts(user.id, newAttempts, null);
        const remaining = MAX_ATTEMPTS - newAttempts;
        throw new AppError(
          401,
          `Credenciales inválidas. Le quedan ${remaining} intento(s) antes del bloqueo temporal de su cuenta.`,
          {
            attemptsRemaining: remaining,
            failedAttempts: newAttempts,
          }
        );
      }
    }

    // Login successful: reset attempts and lock
    await this.repository.resetFailedAttempts(user.id);

    const token = this.generateToken(user.id, user.email, user.role);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<UserWithoutPassword> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(
    userId: string,
    data: { name?: string; preferredCurrency?: string }
  ): Promise<UserWithoutPassword> {
    const updates: Partial<User> = {};
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new AppError(400, 'El nombre no puede estar vacío.');
      }
      updates.name = data.name.trim();
    }
    if (data.preferredCurrency !== undefined) {
      updates.preferredCurrency = data.preferredCurrency.trim().toUpperCase();
    }

    const updated = await this.repository.update(userId, updates);
    if (!updated) {
      throw new AppError(404, 'Usuario no encontrado.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async completeOnboarding(
    userId: string,
    data: {
      preferredCurrency: string;
      initialBalance?: number;
      accountName?: string;
    }
  ): Promise<UserWithoutPassword> {
    const currency = (data.preferredCurrency || 'USD').trim().toUpperCase();

    // 1. Update user onboarding status & preferred currency
    const updatedUser = await this.repository.update(userId, {
      preferredCurrency: currency,
      hasCompletedOnboarding: true,
    });

    if (!updatedUser) {
      throw new AppError(404, 'Usuario no encontrado.');
    }

    // 2. Adjust default account or create one
    const accounts = await accountRepository.findByUserId(userId);
    const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];

    const balance =
      typeof data.initialBalance === 'number' && !isNaN(data.initialBalance)
        ? Math.max(0, data.initialBalance)
        : undefined;

    if (defaultAccount) {
      await accountRepository.update(defaultAccount.id, {
        currency,
        ...(data.accountName?.trim() ? { name: data.accountName.trim() } : {}),
        ...(balance !== undefined ? { balance } : {}),
      });
    } else {
      await accountRepository.create({
        userId,
        name: data.accountName?.trim() || 'Cuenta Principal',
        type: 'CASH',
        balance: balance !== undefined ? balance : 0,
        currency,
        isDefault: true,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado.');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError(400, 'La contraseña actual ingresada es incorrecta.');
    }
    if (newPassword.length < 6) {
      throw new AppError(400, 'La nueva contraseña debe tener al menos 6 caracteres.');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await this.repository.update(userId, { passwordHash });
  }
}

export const authService = new AuthService();
