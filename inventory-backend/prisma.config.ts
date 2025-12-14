import { config as loadEnvConfig } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

loadEnvConfig();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
