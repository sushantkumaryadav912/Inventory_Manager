import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { loadConfig } from './config/configuration';
import { InventoryModule } from './inventory/inventory.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';
import { ContactsModule } from './contacts/contacts.module';
import { ReportsModule } from './reports/reports.module';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),
    PrismaModule,
    AuthModule,
    InventoryModule,
    PurchasesModule,
    SalesModule,
    ContactsModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
