import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../errors/app-error';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const errorMessage = issue ? issue.message : 'Error de validación';
      return next(new AppError(400, errorMessage, result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const issue = result.error.issues[0];
      const errorMessage = issue ? issue.message : 'Error de validación en filtros de búsqueda';
      return next(new AppError(400, errorMessage, result.error.flatten()));
    }
    req.query = result.data as any;
    next();
  };
};
