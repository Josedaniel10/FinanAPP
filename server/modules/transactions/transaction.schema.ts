import { z } from 'zod';

export const createTransactionSchema = z
  .object({
    amount: z.coerce.number().positive('El monto debe ser mayor que 0'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    categoryId: z.string().min(1, 'Debe asociar el movimiento a una categoría válida'),
    accountId: z.string().optional(),
    destinationAccountId: z.string().optional(),
    destinationAmount: z.coerce.number().positive().optional(),
    date: z
      .string()
      .min(1, 'La fecha es obligatoria')
      .regex(/^\d{4}-\d{2}-\d{2}/, 'Formato de fecha inválido (AAAA-MM-DD)'),
    description: z
      .string()
      .trim()
      .min(1, 'La descripción es obligatoria')
      .max(150, 'La descripción no puede exceder 150 caracteres'),
    recurrence: z
      .enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
      .optional()
      .default('NONE'),
    paymentMethod: z
      .enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER', 'OTHER'])
      .optional(),
    notes: z.string().trim().max(300).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'TRANSFER') {
        return Boolean(data.destinationAccountId) && data.destinationAccountId !== data.accountId;
      }
      return true;
    },
    {
      message: 'Para una transferencia, la cuenta de destino debe ser diferente de la cuenta de origen.',
      path: ['destinationAccountId'],
    }
  );

export const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor que 0').optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  categoryId: z.string().min(1).optional(),
  accountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
  destinationAmount: z.coerce.number().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  description: z.string().trim().min(1).max(150).optional(),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  paymentMethod: z
    .enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER', 'OTHER'])
    .optional(),
  notes: z.string().trim().max(300).optional(),
});

export const transactionFilterSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
    categoryId: z.string().optional(),
    accountId: z.string().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)')
      .optional(),
    search: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'La fecha de inicio no puede ser posterior a la fecha final',
      path: ['startDate'],
    }
  );

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterDto = z.infer<typeof transactionFilterSchema>;
