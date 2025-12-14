import { config as loadEnvConfig } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { join } from 'node:path';

// Prisma config may be executed with different working directories.
// Try a few locations so `DATABASE_URL` is available consistently.
loadEnvConfig({
  path:
    process.env.DOTENV_CONFIG_PATH ??
    join(process.cwd(), '.env'),
});

// Fallback when Prisma is invoked from the repo root.
loadEnvConfig({
  path: join(process.cwd(), 'inventory-backend', '.env'),
});

// Fallback for direct execution from this folder (or if Prisma resolves config relative to it).
loadEnvConfig({
  path: join(__dirname, '.env'),
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
