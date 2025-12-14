import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NeonAuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Called after Neon Auth login/signup.
   * 1. Sync user (id, email, name)
   * 2. If user has no shop  create shop + OWNER role
   */
  @Post('onboard')
  @UseGuards(NeonAuthGuard)
  async onboard(@Req() req) {
    const { userId, email, name } = req.user;

    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert user (Neon Auth  app user)
      const user = await tx.users.upsert({
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
          name: `${user.name ?? 'My'} Shop`,
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
