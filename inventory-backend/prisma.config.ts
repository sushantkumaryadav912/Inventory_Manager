import { config as loadEnvConfig } from 'dotenv';
import { defineConfig, env } from 'prisma/config';
import { join } from 'node:path';

loadEnvConfig({
  path: process.env.DOTENV_CONFIG_PATH ?? join(process.cwd(), '.env'),
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
