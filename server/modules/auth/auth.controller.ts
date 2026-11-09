import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './auth.schema.js';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.register(req.body as RegisterDto);
      res.status(201).json({
        data: result,
        message: 'Usuario registrado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body as LoginDto);
      res.status(200).json({
        data: result,
        message: 'Sesión iniciada correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getCurrentUser(req.user!.id);
      res.status(200).json({
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, preferredCurrency } = req.body;
      const user = await this.service.updateProfile(req.user!.id, { name, preferredCurrency });
      res.status(200).json({
        data: { user },
        message: 'Perfil actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  completeOnboarding = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { preferredCurrency, initialBalance, accountName } = req.body;
      const user = await this.service.completeOnboarding(req.user!.id, {
        preferredCurrency,
        initialBalance: typeof initialBalance === 'number' ? initialBalance : undefined,
        accountName,
      });
      res.status(200).json({
        data: { user },
        message: 'Configuración inicial completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      await this.service.changePassword(req.user!.id, currentPassword, newPassword);
      res.status(200).json({
        message: 'Contraseña cambiada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
