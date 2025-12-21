import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  DATABASE_URL: z.string().url(),

  NEON_JWKS_URL: z.string().url(),
 
    NEON_CALLBACK_REDIRECT_URL: z.string().url().optional(),

  NEON_API_KEY: z.string().optional(),

  PORT: z.coerce.number().default(3000),

  ALLOWED_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
