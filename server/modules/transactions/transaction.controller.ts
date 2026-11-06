import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { transactionService, TransactionService } from './transaction.service.js';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFilterDto } from './transaction.schema.js';

export class TransactionController {
  constructor(private readonly service: TransactionService = transactionService) {}

  create = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.create(
        req.user!.id,
        req.body as CreateTransactionDto
      );
      res.status(201).json({
        data: result,
        message:
          result.type === 'INCOME'
            ? 'Ingreso registrado correctamente'
            : 'Gasto registrado correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const items = await this.service.findAll(
        req.user!.id,
        req.query as TransactionFilterDto
      );
      res.status(200).json({
        data: items,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const item = await this.service.findById(req.params.id!, req.user!.id);
      res.status(200).json({
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await this.service.update(
        req.params.id!,
        req.user!.id,
        req.body as UpdateTransactionDto
      );
      res.status(200).json({
        data: updated,
        message: 'Movimiento actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.id!, req.user!.id);
      res.status(200).json({
        message: 'Movimiento eliminado correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  summary = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const summary = await this.service.getSummary(req.user!.id);
      res.status(200).json({
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const transactionController = new TransactionController();
