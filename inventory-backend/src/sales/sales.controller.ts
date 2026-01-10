import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRoles } from '../common/decorators/roles.decorator';
import { Roles } from '../common/constants/roles';
import { SalesService } from './sales.service';
import { CreateSaleSchema } from './sales.schemas';

@Controller('sales')
@UseGuards(JwtAuthGuard, ShopGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequireRoles(Roles.OWNER, Roles.MANAGER, Roles.STAFF)
  async create(
    @Req() req,
    @Body(new ZodValidationPipe(CreateSaleSchema)) body,
  ) {
    return this.salesService.createSale({
      shopId: req.shop.shopId,
      userId: req.user.userId,
      customerId: body.customerId,
      paymentMethod: body.paymentMethod,
      items: body.items,
    });
  }

  @Get()
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async list(@Req() req) {
    return this.salesService.listSales(req.shop.shopId);
  }

  @Get(':id')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async getById(@Req() req, @Param('id') id: string) {
    const sale = await this.salesService.getSaleById(req.shop.shopId, id);
    if (!sale) {
      throw new NotFoundException('Sale order not found');
    }
    return sale;
  }
}
