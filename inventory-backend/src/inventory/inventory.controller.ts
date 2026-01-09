import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRoles } from '../common/decorators/roles.decorator';
import { Roles } from '../common/constants/roles';
import { ZodValidationPipe } from 'nestjs-zod';
import { InventoryService } from './inventory.service';
import {
  AdjustStockSchema,
  BulkImportSchema,
  CreateInventoryItemSchema,
  StockHistoryQuerySchema,
  UpdateInventoryItemSchema,
} from './inventory.schemas';

@Controller('inventory')
@UseGuards(JwtAuthGuard, ShopGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async list(@Req() req, @Query('search') search?: string) {
    const items = await this.inventoryService.listItems(req.shop.shopId, search);
    return { items };
  }

  @Get(':itemId')
  async getOne(@Req() req, @Param('itemId') itemId: string) {
    const item = await this.inventoryService.getItemById(req.shop.shopId, itemId);
    return { item };
  }

  @Post()
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async create(
    @Req() req,
    @Body(new ZodValidationPipe(CreateInventoryItemSchema)) body,
  ) {
    const item = await this.inventoryService.createItem(req.shop.shopId, req.user.userId, body);
    return { item };
  }

  @Patch(':itemId')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async update(
    @Req() req,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(UpdateInventoryItemSchema)) body,
  ) {
    const item = await this.inventoryService.updateItem(req.shop.shopId, itemId, body);
    return { item };
  }

  @Delete(':itemId')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async remove(@Req() req, @Param('itemId') itemId: string) {
    return this.inventoryService.deleteItem(req.shop.shopId, itemId);
  }

  @Get(':itemId/history')
  async history(
    @Req() req,
    @Param('itemId') itemId: string,
    @Query(new ZodValidationPipe(StockHistoryQuerySchema)) query,
  ) {
    const history = await this.inventoryService.getStockHistory(
      req.shop.shopId,
      itemId,
      query.limit ?? 10,
    );
    return { history };
  }

  @Post('bulk-import')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async bulkImport(
    @Req() req,
    @Body(new ZodValidationPipe(BulkImportSchema)) body,
  ) {
    return this.inventoryService.bulkImport(req.shop.shopId, req.user.userId, body.items);
  }

  @Post('adjust')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  async adjust(
    @Req() req,
    @Body(new ZodValidationPipe(AdjustStockSchema)) body,
  ) {
    const isBackendPayload = 'productId' in body;
    const productId = isBackendPayload ? body.productId : body.itemId;

    const quantity = isBackendPayload
      ? body.quantity
      : Math.abs(Math.trunc(body.delta));

    if (!quantity || quantity <= 0) {
      throw new BadRequestException('Quantity must be a non-zero integer');
    }

    const type = isBackendPayload
      ? body.type
      : body.delta > 0
        ? 'IN'
        : 'OUT';

    const source = isBackendPayload
      ? body.source
      : /expired/i.test(body.reason)
        ? 'EXPIRED'
        : /damage|loss/i.test(body.reason)
          ? 'DAMAGE'
          : 'MANUAL';

    return this.inventoryService.adjustStock({
      shopId: req.shop.shopId,
      userId: req.user.userId,
      productId,
      quantity,
      type,
      source,
      referenceId: isBackendPayload ? body.referenceId : undefined,
    });
  }
}
