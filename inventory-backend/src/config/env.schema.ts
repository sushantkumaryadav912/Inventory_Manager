import { z } from 'zod';

/**
 * CORE env: required for safe boot.
 * If these are invalid, we fail fast.
 */
export const coreEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  DATABASE_URL: z.string().url(),

  // Core auth secret (do not allow insecure defaults).
  JWT_SECRET: z.string().min(32),

  PORT: z.coerce.number().default(3000),

  ALLOWED_ORIGINS: z.string().optional(),
});

/**
 * OPTIONAL env: feature-scoped configuration.
 * This MUST NOT block startup; validate lazily when the feature is used.
 */
export const optionalEnvSchema = z.object({
  // Neon auth proxy (used only by /auth/mobile/* endpoints)
  NEON_JWKS_URL: z.string().url().optional(),
  NEON_CALLBACK_REDIRECT_URL: z.string().url().optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_ORIGIN: z.string().url().optional(),
  NEON_API_KEY: z.string().optional(),

  // Brevo Transactional Email
  BREVO_API_KEY: z.string().min(1).optional(),
  BREVO_OTP_TEMPLATE_ID: z.string().optional(),
  BREVO_PASSWORD_RESET_TEMPLATE_ID: z.string().optional(),

  // Keep as raw strings here; validate at send-time.
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),

  // Used to build reset links; validate at use-time.
  APP_URL: z.string().optional(),
});

export type CoreEnv = z.infer<typeof coreEnvSchema>;
export type OptionalEnv = z.infer<typeof optionalEnvSchema>;

export const envSchema = coreEnvSchema.merge(optionalEnvSchema);
export type Env = z.infer<typeof envSchema>;
