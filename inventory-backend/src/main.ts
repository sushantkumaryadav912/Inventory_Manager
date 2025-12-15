import 'dotenv/config';
import { config as loadEnvConfig } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';

// Ensure env vars are available even when the process is started from repo root
// or when running the compiled output from `dist/`.
const envCandidates = [
  // When compiled: dist/src -> inventory-backend/.env
  join(__dirname, '..', '..', '.env'),
  // When started from inventory-backend/
  join(process.cwd(), '.env'),
  // When started from repo root
  join(process.cwd(), 'inventory-backend', '.env'),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnvConfig({ path: envPath });
    break;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet);
  await app.register(compress);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
