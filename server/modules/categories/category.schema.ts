import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(50, 'El nombre no puede exceder los 50 caracteres.'),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().trim().min(1).default('Tag'),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'El color debe ser un valor hexadecimal válido (ej. #10B981).')
    .default('#059669'),
  isDefault: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(50, 'El nombre no puede exceder los 50 caracteres.')
    .optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  icon: z.string().trim().min(1).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'El color debe ser un valor hexadecimal válido (ej. #10B981).')
    .optional(),
  isDefault: z.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
