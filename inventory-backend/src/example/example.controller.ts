import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NeonAuthGuard } from '../auth/auth.guard';
import { ShopGuard } from '../common/guards/shop.guard';
import type { RequestWithShop } from '../common/types/request-with-shop';

@Controller('example')
@UseGuards(NeonAuthGuard, ShopGuard)
export class ExampleController {
  @Get()
  getExample(@Req() req: RequestWithShop) {
    return {
      userId: req.user.userId,
      shopId: req.shop.shopId,
      role: req.shop.role,
    };
  }
}
