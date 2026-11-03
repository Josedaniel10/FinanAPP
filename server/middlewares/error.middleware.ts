import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details || null,
    });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: 'Ocurrió un error inesperado en el servidor',
    details: process.env.NODE_ENV !== 'production' && err instanceof Error ? err.message : null,
  });
};
