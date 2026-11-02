import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().default('finanapp_super_secret_jwt_key_2026_scrum'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('finanapp'),
});

export const env = envSchema.parse(process.env);
