import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NeonAuthGuard } from './auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('onboard')
  @UseGuards(ApiKeyGuard, NeonAuthGuard)
  async onboard(@Req() req) {
    return this.syncUserAndShop(req.user);
  }

  @Post('signup')
  @UseGuards(ApiKeyGuard, NeonAuthGuard)
  async signup(@Req() req) {
    return this.syncUserAndShop(req.user);
  }

  @Post('login')
  @UseGuards(ApiKeyGuard, NeonAuthGuard)
  async login(@Req() req) {
    const { userId, email, name } = req.user;

    // Keep Neon profile in sync even if the user already exists
    await this.prisma.users.upsert({
      where: { id: userId },
      update: { email, name },
      create: { id: userId, email, name },
    });

    const existingUserShop = await this.prisma.user_shops.findFirst({
      where: { user_id: userId },
    });

    if (!existingUserShop) {
      return {
        success: true,
        userId,
        shopId: null,
        role: null,
        isNewShop: false,
        requiresOnboarding: true,
      };
    }

    return {
      success: true,
      userId,
      shopId: existingUserShop.shop_id,
      role: existingUserShop.role,
      isNewShop: false,
      requiresOnboarding: false,
    };
  }

  /**
   * Called after Neon Auth login/signup.
   * 1. Sync user (id, email, name)
   * 2. If user has no shop create shop + OWNER role
   */
  private async syncUserAndShop(user: {
    userId: string;
    email: string;
    name?: string | null;
  }) {
    const { userId, email, name } = user;

    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert user (Neon Auth -> app user)
      const userRecord = await tx.users.upsert({
        where: { id: userId },
        update: {
          email,
          name,
        },
        create: {
          id: userId,
          email,
          name,
        },
      });

      // 2. Check if user already has a shop
      const existingUserShop = await tx.user_shops.findFirst({
        where: { user_id: userId },
        include: { shops: true },
      });

      if (existingUserShop?.shop_id) {
        return {
          success: true,
          userId,
          shopId: existingUserShop.shop_id,
          role: existingUserShop.role,
          isNewShop: false,
        };
      }

      // 3. Create default shop
      const shop = await tx.shops.create({
        data: {
          name: `${userRecord.name ?? 'My'} Shop`,
          business_type: 'inventory',
        },
      });

      // 4. Assign OWNER role
      await tx.user_shops.create({
        data: {
          user_id: userId,
          shop_id: shop.id,
          role: 'OWNER',
        },
      });

      return {
        success: true,
        userId,
        shopId: shop.id,
        role: 'OWNER',
        isNewShop: true,
      };
    });
  }
}
