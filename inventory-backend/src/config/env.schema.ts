import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEON_JWKS_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production']),
});
