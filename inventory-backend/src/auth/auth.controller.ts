import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  UseGuards,
  Logger,
  Req,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { PasswordResetService } from './password-reset.service';
import { OtpThrottlerGuard } from './otp-throttler.guard';
import { EmailValidatorService } from './email-validator.service';
import { JwtAuthGuard } from './jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailValidatorService: EmailValidatorService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('signup')
  async signup(@Body() body: { email: string; password: string; name?: string }) {
    try {
      const { email, password, name } = body;

      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      // Step 1: Validate email with Abstract API
      const validationResult = await this.emailValidatorService.validateEmail(email);
      if (!validationResult.isValid) {
        throw new BadRequestException(validationResult.reason || 'Invalid email address');
      }

      // Step 2: Check if user already exists
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Step 3: Create user with password (email not verified yet)
      const result = await this.authService.signup(email, password, name);

      // Step 4: Generate verification token and send verification email
      const verificationToken = this.emailValidatorService.generateVerificationToken();
      const verificationUrl = this.emailValidatorService.getVerificationUrl(verificationToken);
      const tokenExpiresAt = new Date(Date.now() + this.emailValidatorService.getVerificationTokenExpiry());

      // Update user with verification token
      await this.prisma.users.update({
        where: { id: result.user.id },
        data: {
          verification_token: verificationToken,
          verification_token_expires_at: tokenExpiresAt,
        },
      });

      // Log verification attempt
      await this.prisma.email_verification_logs.create({
        data: {
          user_id: result.user.id,
          email: email,
          verification_token: verificationToken,
          token_expires_at: tokenExpiresAt,
          abstract_api_result: JSON.stringify(validationResult.details || {}),
        },
      });

      // Step 5: Send verification email via Brevo
      let verificationEmailSent = true;
      try {
        verificationEmailSent = await this.emailValidatorService.sendVerificationEmail(
          email,
          name || email.split('@')[0],
          verificationToken,
          verificationUrl,
        );
        if (!verificationEmailSent) {
          throw new Error('Verification email was not sent');
        }
      } catch (err) {
        verificationEmailSent = false;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Signup succeeded, but sending verification email failed: ${message}`,
          err instanceof Error ? err.stack : undefined,
        );
      }

      // Sync user and shop
      await this.syncUserAndShop({
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });

      return {
        ...result,
        message: verificationEmailSent
          ? 'Signup successful! Please check your email to verify your account.'
          : 'Signup successful, but we could not send the verification email. Please try again using resend verification.',
        verificationEmailSent,
        emailVerified: false,
        requiresEmailVerification: true,
      };
    } catch (error) {
      this.logger.error(`Signup failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify email using token sent to user's email
   */
  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    try {
      const { token } = body;

      if (!token) {
        throw new BadRequestException('Verification token is required');
      }

      // Find verification log
      const verificationLog = await this.prisma.email_verification_logs.findFirst({
        where: {
          verification_token: token,
          is_verified: false,
        },
      });

      if (!verificationLog) {
        throw new BadRequestException('Invalid or already used verification token');
      }

      // Check if token has expired
      if (new Date() > verificationLog.token_expires_at) {
        throw new BadRequestException('Verification token has expired. Please sign up again.');
      }

      // Mark as verified
      await this.prisma.email_verification_logs.update({
        where: { id: verificationLog.id },
        data: {
          is_verified: true,
          verified_at: new Date(),
        },
      });

      // Update user
      const user = await this.prisma.users.update({
        where: { id: verificationLog.user_id },
        data: {
          email_verified: true,
          email_verified_at: new Date(),
          verification_token: null,
          verification_token_expires_at: null,
        },
      });

      this.logger.log(`Email verified successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'Email verified successfully! You can now log in.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: { email: string }) {
    try {
      const { email } = body;

      if (!email) {
        throw new BadRequestException('Email is required');
      }

      // Find user
      const user = await this.prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.email_verified) {
        throw new BadRequestException('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = this.emailValidatorService.generateVerificationToken();
      const verificationUrl = this.emailValidatorService.getVerificationUrl(verificationToken);
      const tokenExpiresAt = new Date(Date.now() + this.emailValidatorService.getVerificationTokenExpiry());

      // Update user with new token
      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          verification_token: verificationToken,
          verification_token_expires_at: tokenExpiresAt,
        },
      });

      // Log new verification attempt
      await this.prisma.email_verification_logs.create({
        data: {
          user_id: user.id,
          email: email,
          verification_token: verificationToken,
          token_expires_at: tokenExpiresAt,
        },
      });

      // Send verification email
      await this.emailValidatorService.sendVerificationEmail(
        email,
        user.name || email.split('@')[0],
        verificationToken,
        verificationUrl,
      );

      this.logger.log(`Verification email resent to: ${email}`);

      return {
        success: true,
        message: 'Verification email sent successfully!',
      };
    } catch (error) {
      this.logger.error(`Resend verification email failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const { email, password } = body;

      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }

      const result = await this.authService.login(email, password);

      // Get user shop info
      const userShop = await this.prisma.user_shops.findFirst({
        where: { user_id: result.user.id },
        include: { shops: true },
      });

      return {
        ...result,
        user: {
          ...result.user,
          shopId: userShop?.shop_id || null,
          shopName: userShop?.shops?.name || null,
          role: userShop?.role || null,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req) {
    try {
      const { userId, email, name } = req.user;

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
            shopName: null,
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
    } catch (error) {
      this.logger.error(`Get current user failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout() {
    return;
  }

  @Post('request-otp')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async requestOtp(@Body() body: { email: string; name?: string; type?: string }) {
    try {
      const { email, name, type = 'email_verification' } = body;

      if (!email) {
        throw new BadRequestException('Email is required');
      }

      if (type === 'password_reset') {
        // Backwards compatible: password reset is reset-link–based.
        return await this.passwordResetService.requestPasswordReset(email);
      }

      return await this.otpService.requestEmailVerificationOtp(email, name);
    } catch (error) {
      this.logger.error(`Request OTP failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('verify-otp')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async verifyOtp(@Body() body: { email: string; otp_code: string; type?: string }) {
    try {
      const { email, otp_code, type = 'email_verification' } = body;

      if (!email || !otp_code) {
        throw new BadRequestException('Email and OTP code are required');
      }

      if (type === 'password_reset') {
        throw new BadRequestException('Password reset OTP verification is not supported');
      }

      return await this.otpService.verifyEmailOtp(email, otp_code);
    } catch (error) {
      this.logger.error(`Verify OTP failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('reset-password')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async resetPassword(@Body() body: { userId: string; token: string; newPassword: string }) {
    try {
      return await this.passwordResetService.resetPasswordWithToken(body);
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('request-password-reset')
  @UseGuards(OtpThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async requestPasswordReset(@Body() body: { email: string }) {
    try {
      const { email } = body;
      if (!email) {
        throw new BadRequestException('Email is required');
      }
      return await this.passwordResetService.requestPasswordReset(email);
    } catch (error) {
      this.logger.error(`Request password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('onboard')
  @UseGuards(JwtAuthGuard)
  async onboard(@Req() req, @Body() body: { shopName: string; businessType?: string }) {
    const { userId } = req.user;
    const { shopName, businessType } = body;

    if (!shopName) {
      throw new BadRequestException('Shop name is required');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Check if user already has a shop
        const userShop = await tx.user_shops.findFirst({
          where: { user_id: userId, role: 'OWNER' },
          include: { shops: true },
        });

        if (userShop?.shops) {
          // Update existing shop
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

        // Create new shop
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
    } catch (error) {
      this.logger.error(`Onboard failed: ${error.message}`, error.stack);
      throw error;
    }
  }


  /**
   * Sync user and create default shop if needed
   */
  private async syncUserAndShop(user: {
    userId: string;
    email: string;
    name?: string | null;
  }) {
    const { userId, email, name } = user;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Upsert user
        const userRecord = await tx.users.upsert({
          where: { id: userId },
          update: {
            email,
            ...(name ? { name } : {}),
          },
          create: {
            id: userId,
            email,
            name,
          },
        });

        // Check if user already has a shop
        const existingUserShop = await tx.user_shops.findFirst({
          where: { user_id: userId },
        });

        if (existingUserShop?.shop_id) {
          return;
        }

        // Create default shop
        const shop = await tx.shops.create({
          data: {
            name: `${userRecord.name ?? 'My'} Shop`,
            business_type: 'inventory',
          },
        });

        // Assign OWNER role
        await tx.user_shops.create({
          data: {
            user_id: userId,
            shop_id: shop.id,
            role: 'OWNER',
          },
        });
      });
    } catch (error) {
      this.logger.error(`Sync user and shop failed: ${error.message}`, error.stack);
      // Don't throw - sync is best effort
    }
  }
}
