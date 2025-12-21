import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NeonAuthGuard } from './auth.guard';
import type { FastifyReply } from 'fastify';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('onboard')
  @UseGuards(NeonAuthGuard)
  async onboard(@Req() req) {
    return this.syncUserAndShop(req.user);
  }

  @Post('signup')
  @UseGuards(NeonAuthGuard)
  async signup(@Req() req) {
    return this.syncUserAndShop(req.user);
  }

  @Post('login')
  @UseGuards(NeonAuthGuard)
  async login(@Req() req) {
    try {
      const { userId, email, name } = req.user;

      this.logger.log(`Login attempt for user: ${email}`);

      // Keep Neon profile in sync even if the user already exists
      await this.prisma.users.upsert({
        where: { id: userId },
        update: { email, name, updated_at: new Date() },
        create: { id: userId, email, name },
      });

      const existingUserShop = await this.prisma.user_shops.findFirst({
        where: { user_id: userId },
        include: { shops: true },
      });

      if (!existingUserShop) {
        this.logger.log(`User ${email} requires onboarding`);
        return {
          success: true,
          userId,
          shopId: null,
          role: null,
          isNewShop: false,
          requiresOnboarding: true,
        };
      }

      this.logger.log(`User ${email} logged in successfully with shop ${existingUserShop.shop_id}`);
      return {
        success: true,
        userId,
        shopId: existingUserShop.shop_id,
        shopName: existingUserShop.shops?.name,
        role: existingUserShop.role,
        isNewShop: false,
        requiresOnboarding: false,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Login failed. Please try again.');
    }
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
        name: user.name,
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
    res?.header('Access-Control-Allow-Origin', '*');
    res?.header('Access-Control-Allow-Credentials', 'true');

    if (!code || !state) {
      throw new BadRequestException('Missing Neon callback parameters');
    }

    const redirectTarget = process.env.NEON_CALLBACK_REDIRECT_URL;

    if (redirectTarget && res) {
      const url = new URL(redirectTarget);
      url.searchParams.set('code', code);
      url.searchParams.set('state', state);
      res.redirect(url.toString());
      return;
    }

    res?.status(200);
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
