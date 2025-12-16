import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is not set. Add it to your environment variables.',
      );
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });

    super({
      adapter: new PrismaPg(pool),
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✓ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('✓ Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error during database disconnection', error);
    }
  }
}
