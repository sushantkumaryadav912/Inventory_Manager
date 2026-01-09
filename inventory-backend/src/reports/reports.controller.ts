import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRoles } from '../common/decorators/roles.decorator';
import { Roles } from '../common/constants/roles';
import { ReportsService } from './reports.service';
import { DateRangeSchema, OptionalDateRangeSchema } from './reports.schemas';

@Controller('reports')
@UseGuards(JwtAuthGuard, ShopGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @RequireRoles(Roles.OWNER, Roles.MANAGER, Roles.STAFF)
  async overview(@Req() req) {
    const stats = await this.reportsService.overviewStats(req.shop.shopId);
    return { stats };
  }

  @Get('inventory')
  @RequireRoles(Roles.OWNER, Roles.MANAGER, Roles.STAFF)
  async inventory(@Req() req) {
    const report = await this.reportsService.inventoryReport(req.shop.shopId);
    return { report };
  }

  /* Daily summary */
  @Get('daily')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  daily(@Req() req) {
    return this.reportsService.dailySales(
      req.shop.shopId,
      new Date(),
    );
  }

  /* Sales by date range */
  @Get('sales')
  @RequireRoles(Roles.OWNER, Roles.MANAGER, Roles.STAFF)
  sales(
    @Req() req,
    @Query(new ZodValidationPipe(OptionalDateRangeSchema)) query,
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    return this.reportsService
      .salesSummary(req.shop.shopId, from, to)
      .then((report) => ({ report }));
  }

  @Get('purchases')
  @RequireRoles(Roles.OWNER, Roles.MANAGER, Roles.STAFF)
  purchases(
    @Req() req,
    @Query(new ZodValidationPipe(OptionalDateRangeSchema)) query,
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    return this.reportsService
      .purchasesSummary(req.shop.shopId, from, to)
      .then((report) => ({ report }));
  }

  /* Low stock */
  @Get('low-stock')
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  lowStock(@Req() req) {
    return this.reportsService.lowStock(req.shop.shopId);
  }

  /* Profit */
  @Get('profit')
  @RequireRoles(Roles.OWNER)
  profit(
    @Req() req,
    @Query(new ZodValidationPipe(OptionalDateRangeSchema)) query,
  ) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (!from || !to) {
      const now = new Date();
      const start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return this.reportsService.profitEstimate(req.shop.shopId, start, end);
    }
    return this.reportsService.profitEstimate(req.shop.shopId, from, to);
  }
}
