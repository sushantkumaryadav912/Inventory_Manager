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

@Module({
  imports: [
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
})
export class AppModule {}
