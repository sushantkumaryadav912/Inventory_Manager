import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NeonAuthGuard } from '../auth/auth.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRoles } from '../common/decorators/roles.decorator';
import { Roles } from '../common/constants/roles';
import { ZodValidationPipe } from 'nestjs-zod';
import { InventoryService } from './inventory.service';
import { AdjustStockSchema } from './inventory.schemas';

@Controller('inventory')
@UseGuards(NeonAuthGuard, ShopGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async list(@Req() req) {
    return this.inventoryService.getInventory(req.shop.shopId);
  }

  @Post('adjust')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async adjust(
    @Req() req,
    @Body(new ZodValidationPipe(AdjustStockSchema)) body,
  ) {
    return this.inventoryService.adjustStock({
      shopId: req.shop.shopId,
      userId: req.user.userId,
      productId: body.productId,
      quantity: body.quantity,
      type: body.type,
      source: body.source,
      referenceId: body.referenceId,
    });
  }
}
