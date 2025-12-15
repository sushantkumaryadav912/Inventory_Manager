import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { NeonAuthGuard } from '../auth/auth.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRoles } from '../common/decorators/roles.decorator';
import { Roles } from '../common/constants/roles';
import { CustomersService } from './customers.service';
import { CustomerSchema } from './contacts.schemas';

@Controller('customers')
@UseGuards(NeonAuthGuard, ShopGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  create(
    @Req() req,
    @Body(new ZodValidationPipe(CustomerSchema)) body,
  ) {
    return this.customersService.create(req.shop.shopId, body);
  }

  @Get()
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  list(@Req() req) {
    return this.customersService.list(req.shop.shopId);
  }
}
