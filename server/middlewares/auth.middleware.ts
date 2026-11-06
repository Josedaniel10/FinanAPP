import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { authRepository } from '../modules/auth/auth.repository.js';
import { UserWithoutPassword } from '../modules/auth/auth.types.js';

export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword;
}

interface JwtPayload {
  userId: string;
  email: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No autorizado. Token de autenticación ausente.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'No autorizado. Formato de token inválido.');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError(401, 'Sesión expirada o token inválido. Inicie sesión nuevamente.');
    }

    const user = await authRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError(401, 'Usuario no encontrado o sesión inválida.');
    }

    // Strip passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AppError(401, 'No autenticado. Inicie sesión para continuar.');
  }
  if (req.user.role !== 'ADMIN') {
    throw new AppError(403, 'Acceso denegado. Se requieren privilegios de Administrador.');
  }
  next();
};

