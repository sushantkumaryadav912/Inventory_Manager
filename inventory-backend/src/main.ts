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

// Load environment variables only in non-production or when .env exists locally
if (process.env.NODE_ENV !== 'production') {
  const envCandidates = [
    join(__dirname, '..', '..', '.env'),
    join(process.cwd(), '.env'),
    join(process.cwd(), 'inventory-backend', '.env'),
  ];

  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      loadEnvConfig({ path: envPath, override: false });
      console.log(`✓ Loaded environment from: ${envPath}`);
      break;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
      // Required for correct client IP resolution behind proxies (Render, Nginx, etc).
      // Used by rate limiting/throttling keyed by IP.
      trustProxy: true,
    }),
  );

  // Fastify rejects empty bodies for application/json by default.
  // Our mobile client can send POSTs with JSON headers but no body (e.g., /auth/logout).
  // This parser treats an empty JSON body as an empty object.
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addContentTypeParser(
    ['application/json', 'application/*+json'],
    { parseAs: 'string' },
    (req: any, body: string, done: (err: Error | null, value?: any) => void) => {
      if (body === '' || body === undefined || body === null) {
        return done(null, {});
      }
      try {
        return done(null, JSON.parse(body));
      } catch (err) {
        return done(err as Error);
      }
    },
  );

  // Configure Helmet with production-ready security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'https:'],
        scriptSrc: [`'self'`],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // Configure compression
  await app.register(compress, { 
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });

  // Configure CORS with environment-based origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

  // For production, allow specified origins or all origins if ALLOWED_ORIGINS is empty
  const corsOrigin = process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS
    ? allowedOrigins
    : true; // Allow all origins in development or if ALLOWED_ORIGINS not set

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-shop-id'],
  });

  // Apply global filters and interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS) {
    console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
  } else {
    console.log(`🔒 CORS enabled for: all origins (use ALLOWED_ORIGINS env var to restrict)`);
  }

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
    try {
      await app.close();
      console.log('✓ Application closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
