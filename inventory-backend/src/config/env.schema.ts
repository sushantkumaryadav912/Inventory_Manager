import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  DATABASE_URL: z.string().url(),

  NEON_JWKS_URL: z.string().url(),

  NEON_CALLBACK_REDIRECT_URL: z.string().url().optional(),

  // Used by backend-only Neon Auth proxy endpoints (/auth/mobile/*)
  // Kept optional to avoid breaking existing deployments until configured.
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_ORIGIN: z.string().url().optional(),

  NEON_API_KEY: z.string().optional(),

  PORT: z.coerce.number().default(3000),

  ALLOWED_ORIGINS: z.string().optional(),
  
  // Brevo Transactional Email
  BREVO_API_KEY: z.string().min(1).optional(),
  BREVO_OTP_TEMPLATE_ID: z.string().regex(/^\d+$/).optional(),
  BREVO_PASSWORD_RESET_TEMPLATE_ID: z.string().regex(/^\d+$/).optional(),

  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).optional(),
  SUPPORT_EMAIL: z.string().email().optional(),

  APP_URL: z.string().min(1).optional(),
}).superRefine((env, ctx) => {
  // In production, require explicit email configuration.
  if (env.NODE_ENV === 'production') {
    if (!env.BREVO_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BREVO_API_KEY'],
        message: 'BREVO_API_KEY is required in production.',
      });
    }

    if (!env.EMAIL_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMAIL_FROM'],
        message: 'EMAIL_FROM is required in production and must be a verified sender domain in Brevo.',
      });
    }

    if (!env.EMAIL_FROM_NAME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMAIL_FROM_NAME'],
        message: 'EMAIL_FROM_NAME is required in production.',
      });
    }

    if (!env.SUPPORT_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPPORT_EMAIL'],
        message: 'SUPPORT_EMAIL is required in production.',
      });
    }

    if (!env.BREVO_OTP_TEMPLATE_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BREVO_OTP_TEMPLATE_ID'],
        message: 'BREVO_OTP_TEMPLATE_ID is required in production (numeric template ID).',
      });
    }

    if (!env.BREVO_PASSWORD_RESET_TEMPLATE_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BREVO_PASSWORD_RESET_TEMPLATE_ID'],
        message: 'BREVO_PASSWORD_RESET_TEMPLATE_ID is required in production (numeric template ID).',
      });
    }

    if (!env.APP_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['APP_URL'],
        message: 'APP_URL is required in production to generate password reset links.',
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;
