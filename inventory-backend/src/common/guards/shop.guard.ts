import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestWithShop } from '../types/request-with-shop';

@Injectable()
export class ShopGuard implements CanActivate {
  private readonly logger = new Logger(ShopGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithShop>();

    const rawShopId = req.headers['x-shop-id'];
    const shopId = Array.isArray(rawShopId) ? rawShopId[0] : rawShopId;
    const userId = req.user?.userId;

    if (!shopId) {
      throw new BadRequestException('x-shop-id header is required');
    }

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      // Check user ↔ shop mapping
      const userShop = await this.prisma.user_shops.findFirst({
        where: {
          user_id: userId,
          shop_id: shopId,
        },
      });

      if (!userShop) {
        this.logger.warn(
          `Access denied: User ${userId} attempted to access shop ${shopId}`,
        );
        throw new ForbiddenException('Access to this shop is forbidden');
      }

      // Attach shop context to request
      req.shop = {
        shopId,
        role: userShop.role,
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error in ShopGuard', error);
      throw new ForbiddenException('Unable to verify shop access');
    }
  }
}