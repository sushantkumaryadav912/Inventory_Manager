import { envSchema } from './env.schema';

export function loadConfig() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment configuration');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}
