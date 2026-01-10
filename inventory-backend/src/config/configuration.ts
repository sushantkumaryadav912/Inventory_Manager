import { z } from 'zod';
import { coreEnvSchema, optionalEnvSchema } from './env.schema';

function isValidEmail(value: string | undefined): boolean {
  if (!value) return false;
  return z.string().email().safeParse(value).success;
}

function isPositiveIntString(value: string | undefined): boolean {
  if (!value) return false;
  return /^\d+$/.test(value.trim()) && Number(value) > 0;
}

export function loadConfig() {
  const coreParsed = coreEnvSchema.safeParse(process.env);

  if (!coreParsed.success) {
    console.error('❌ Invalid CORE environment configuration');
    console.error(coreParsed.error.format());
    process.exit(1);
  }

  // Optional env must never block startup.
  const optionalParsed = optionalEnvSchema.safeParse(process.env);
  const optional = optionalParsed.success ? optionalParsed.data : {};

  if (!optionalParsed.success) {
    console.warn('⚠️ Optional environment configuration has issues; affected features will be disabled.');
    console.warn(optionalParsed.error.format());
  }

  // Startup diagnostics (sanitized; do not print secrets).
  const hasBrevoKey = Boolean(optional.BREVO_API_KEY);
  const emailFromRaw = optional.EMAIL_FROM;
  const emailConfigPresent =
    Boolean(emailFromRaw) && Boolean(optional.EMAIL_FROM_NAME) && Boolean(optional.SUPPORT_EMAIL);

  const otpTemplateOk = isPositiveIntString(optional.BREVO_OTP_TEMPLATE_ID);
  const resetTemplateOk = isPositiveIntString(optional.BREVO_PASSWORD_RESET_TEMPLATE_ID);

  const emailFromLooksValid = isValidEmail(emailFromRaw);
  const supportEmailLooksValid = isValidEmail(optional.SUPPORT_EMAIL);

  const emailFeatureEnabled =
    hasBrevoKey &&
    emailConfigPresent &&
    otpTemplateOk &&
    resetTemplateOk &&
    emailFromLooksValid &&
    supportEmailLooksValid;

  if (!emailFeatureEnabled) {
    const reasons: string[] = [];
    if (!hasBrevoKey) reasons.push('missing BREVO_API_KEY');
    if (!emailConfigPresent) reasons.push('missing EMAIL_FROM / EMAIL_FROM_NAME / SUPPORT_EMAIL');
    if (emailConfigPresent && !emailFromLooksValid) reasons.push('invalid EMAIL_FROM');
    if (emailConfigPresent && !supportEmailLooksValid) reasons.push('invalid SUPPORT_EMAIL');
    if (!otpTemplateOk) reasons.push('invalid BREVO_OTP_TEMPLATE_ID');
    if (!resetTemplateOk) reasons.push('invalid BREVO_PASSWORD_RESET_TEMPLATE_ID');

    console.warn(`⚠️ Email service disabled: ${reasons.join(', ')}`);
  } else {
    console.log('✅ Email service enabled');
  }

  return {
    ...coreParsed.data,
    ...optional,
    // Expose a safe feature flag for runtime decisions.
    FEATURES: {
      email: {
        enabled: emailFeatureEnabled,
      },
    },
  };
}
