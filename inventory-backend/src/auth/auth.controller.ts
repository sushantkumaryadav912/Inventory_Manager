BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NeonAuthGuard } from './auth.guard';
import type { FastifyReply } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) { }

  @Post('onboard')
  @UseGuards(NeonAuthGuard)
  async onboard(@Req() req, @Body() body: { shopName: string; businessType?: string }) {
    const { userId } = req.user;
    const { shopName, businessType } = body;

    if (!shopName) {
      throw new BadRequestException('Shop name is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Check if user already has an updated shop (OWNER role)
      const userShop = await tx.user_shops.findFirst({
        where: { user_id: userId, role: 'OWNER' },
        include: { shops: true },
      });

      if (userShop?.shops) {
        // Update existing shop (created by syncUserAndShop during login)
        const updatedShop = await tx.shops.update({
          where: { id: userShop.shops.id },
          data: {
            name: shopName,
            business_type: businessType || userShop.shops.business_type,
          },
        });

        return {
          success: true,
          shopId: updatedShop.id,
          message: 'Shop set up successfully',
        };
      }

      // 2. Fallback: Create new shop if for some reason it doesn't exist
      const shop = await tx.shops.create({
        data: {
          name: shopName,
          business_type: businessType || 'inventory',
        },
      });

      await tx.user_shops.create({
        data: {
          user_id: userId,
          shop_id: shop.id,
          role: 'OWNER',
        },
      });

      return {
        success: true,
        shopId: shop.id,
        message: 'Shop created successfully',
      };
    });
  }

  @Post('signup')
  @UseGuards(NeonAuthGuard)
  async signup(@Req() req) {
    return this.syncUserAndShop(req.user);
  }

  @Post('login')
  @UseGuards(NeonAuthGuard)
  async login(@Req() req) {
    // We use the same logic as signup/onboard to ensure:
    // 1. User is synced safely (keeping existing name if token has none)
    // 2. Shop is created if missing (so user always has a shop)
    const result = await this.syncUserAndShop(req.user);

    return {
      ...result,
      requiresOnboarding: result.isNewShop, // If new shop was created, show onboarding
    };
  }

  @Get('me')
  @UseGuards(NeonAuthGuard)
  async getCurrentUser(@Req() req) {
    const { userId, email, name } = req.user;

    // Get user with shop relationship
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_shops: {
          include: {
            shops: true,
          },
        },
      },
    });

    if (!user) {
      // If user doesn't exist in our DB yet, return basic info
      return {
        user: {
          id: userId,
          email,
          name,
          shopId: null,
          role: null,
        },
      };
    }

    const userShop = user.user_shops?.[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name, // Use DB name as it might be more up to date
        shopId: userShop?.shop_id || null,
        shopName: userShop?.shops?.name || null,
        role: userShop?.role || null,
      },
    };
  }

  @Post('logout')
  @UseGuards(NeonAuthGuard)
  async logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('neon/callback')
  async neonCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    // Ensure headers for CORS are set if this is called directly from browser to API
    if (res) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    if (!code || !state) {
      throw new BadRequestException('Missing Neon callback parameters');
    }

    const redirectTarget = process.env.NEON_CALLBACK_REDIRECT_URL;

    // Safely construct redirect URL
    if (redirectTarget && res) {
      try {
        const url = new URL(redirectTarget);
        url.searchParams.set('code', code);
        url.searchParams.set('state', state);

        // Use 302 Found for temporary redirect
        res.status(302).redirect(url.toString());
        return;
      } catch (e) {
        // Fallback if URL is invalid
        console.error('Invalid NEON_CALLBACK_REDIRECT_URL', e);
      }
    }

    // Fallback response if no redirect (e.g. mobile deep linking handled differently or misconfig)
    if (res) {
      res.status(200);
    }

    return {
      success: true,
      message: 'Neon callback received',
      code,
      state,
      timestamp: new Date().toISOString(),
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
          ...(name ? { name } : {}), // Only update name if provided (don't overwrite with null)
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
