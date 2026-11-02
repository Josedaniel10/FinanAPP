import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres'),
  email: z
    .string()
    .trim()
    .email('El formato del correo electrónico es inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('El formato del correo electrónico es inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Debe ingresar su contraseña'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
