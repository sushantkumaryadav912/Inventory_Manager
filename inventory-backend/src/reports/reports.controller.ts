import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { NeonAuthGuard } from '../auth/auth.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireRoles } from '../common/decorators/roles.decorator';
import { Roles } from '../common/constants/roles';
import { ReportsService } from './reports.service';
import { DateRangeSchema } from './reports.schemas';

@Controller('reports')
@UseGuards(NeonAuthGuard, ShopGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
  @RequireRoles(Roles.OWNER, Roles.MANAGER)
  sales(
    @Req() req,
    @Query(new ZodValidationPipe(DateRangeSchema)) query,
  ) {
    return this.reportsService.salesByRange(
      req.shop.shopId,
      new Date(query.from),
      new Date(query.to),
    );
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
    @Query(new ZodValidationPipe(DateRangeSchema)) query,
  ) {
    return this.reportsService.profitEstimate(
      req.shop.shopId,
      new Date(query.from),
      new Date(query.to),
    );
  }
}
