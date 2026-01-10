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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseSchema } from './purchases.schemas';

@Controller('purchases')
@UseGuards(JwtAuthGuard, ShopGuard, RolesGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async create(
    @Req() req,
    @Body(new ZodValidationPipe(CreatePurchaseSchema)) body,
  ) {
    return this.purchasesService.createPurchase({
      shopId: req.shop.shopId,
      userId: req.user.userId,
      supplierId: body.supplierId,
      items: body.items,
    });
  }

  @Get()
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async list(@Req() req) {
    return this.purchasesService.listPurchases(req.shop.shopId);
  }

  @Get(':id')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async getById(@Req() req, @Param('id') id: string) {
    const purchase = await this.purchasesService.getPurchaseById(
      req.shop.shopId,
      id,
    );
    if (!purchase) {
      throw new NotFoundException('Purchase order not found');
    }
    return purchase;
  }
}
