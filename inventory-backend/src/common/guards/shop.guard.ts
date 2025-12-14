import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithShop } from '../types/request-with-shop';

@Injectable()
export class ShopGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithShop>();

    const rawShopId = req.headers['x-shop-id'];
    const shopId = Array.isArray(rawShopId) ? rawShopId[0] : rawShopId;
    const userId = req.user?.userId;

    if (!shopId) {
      throw new ForbiddenException('x-shop-id header is required');
    }

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check user ↔ shop mapping
    const userShop = await this.prisma.user_shops.findFirst({
      where: {
        user_id: userId,
        shop_id: shopId,
      },
    });

    if (!userShop) {
      throw new ForbiddenException('Access to this shop is forbidden');
    }

    // Attach shop context to request
    req.shop = {
      shopId,
      role: userShop.role,
    };

    return true;
  }
}