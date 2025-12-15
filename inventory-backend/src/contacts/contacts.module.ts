import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  controllers: [SuppliersController, CustomersController],
  providers: [SuppliersService, CustomersService],
})
export class ContactsModule {}
