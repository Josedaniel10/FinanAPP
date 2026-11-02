import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    categoryId: z.string().min(1, 'La categoría es requerida.'),
    name: z.string().trim().max(100).optional(),
    limitAmount: z
      .number()
      .positive('El monto límite debe ser mayor que 0.'),
    period: z
      .enum(['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM'])
      .default('MONTHLY'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha de inicio inválido (YYYY-MM-DD).'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha de fin inválido (YYYY-MM-DD).'),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
    path: ['endDate'],
  });

export const updateBudgetSchema = z
  .object({
    categoryId: z.string().min(1).optional(),
    name: z.string().trim().max(100).optional(),
    limitAmount: z.number().positive('El monto límite debe ser mayor que 0.').optional(),
    period: z.enum(['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM']).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha de inicio inválido (YYYY-MM-DD).')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha de fin inválido (YYYY-MM-DD).')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
      path: ['endDate'],
    }
  );

export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;
