import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = {
    email_verification: 10,
    password_reset: 30,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate a random OTP code
   */
  private generateOtpCode(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Request OTP for email verification (during signup)
   */
  async requestEmailVerificationOtp(email: string, userName?: string): Promise<{
    success: boolean;
    message: string;
    nextVerificationAttempt?: Date;
  }> {
    try {
      // Check if too many OTP requests in short time (rate limiting)
      const recentOtps = await this.prisma.otp_tokens.findMany({
        where: {
          email,
          type: 'email_verification',
          created_at: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // Last 2 minutes
          },
        },
      });

      if (recentOtps.length >= 3) {
        const oldestOtp = recentOtps[0];
        const nextAttempt = new Date(oldestOtp.created_at.getTime() + 15 * 60 * 1000); // 15 min cooldown
        
        throw new BadRequestException(
          `Too many OTP requests. Please try again after ${nextAttempt.toISOString()}`,
        );
      }

      // Generate OTP
      const otpCode = this.generateOtpCode();
      const expiryMinutes = this.OTP_EXPIRY_MINUTES.email_verification;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Save OTP to database
      await this.prisma.otp_tokens.create({
        data: {
          user_id: '00000000-0000-0000-0000-000000000000', // Temp UUID for non-registered users
          email,
          otp_code: otpCode,
          type: 'email_verification',
          expires_at: expiresAt,
        },
      });

      // Send OTP via email
      await this.emailService.sendOtpEmail(email, otpCode, userName);

      this.logger.log(`Email verification OTP requested for ${email}`);

      return {
        success: true,
        message: `Verification code sent to ${email}. It will expire in ${expiryMinutes} minutes.`,
      };
    } catch (error) {
      this.logger.error(`Failed to request OTP for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyEmailOtp(email: string, otpCode: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!otpCode || otpCode.length !== this.OTP_LENGTH) {
        throw new BadRequestException(
          `Invalid OTP format. Expected ${this.OTP_LENGTH} digits.`,
        );
      }

      // Find valid OTP
      const otp = await this.prisma.otp_tokens.findFirst({
        where: {
          email,
          otp_code: otpCode,
          type: 'email_verification',
          is_used: false,
          expires_at: {
            gte: new Date(), // Not expired
          },
        },
      });

      if (!otp) {
        this.logger.warn(`Invalid or expired OTP attempt for ${email}`);
        throw new UnauthorizedException(
          'Invalid or expired OTP. Please request a new code.',
        );
      }

      // Mark OTP as used
      await this.prisma.otp_tokens.update({
        where: { id: otp.id },
        data: { is_used: true },
      });

      this.logger.log(`Email OTP verified for ${email}`);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to verify OTP for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Request OTP for password reset
   */
  async requestPasswordResetOtp(email: string, userName?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check if user exists
      const user = await this.prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists (security best practice)
        throw new BadRequestException(
          'If this email is registered, you will receive a password reset code.',
        );
      }

      // Check rate limiting
      const recentOtps = await this.prisma.otp_tokens.findMany({
        where: {
          email,
          type: 'password_reset',
          created_at: {
            gte: new Date(Date.now() - 2 * 60 * 1000),
          },
        },
      });

      if (recentOtps.length >= 3) {
        const oldestOtp = recentOtps[0];
        const nextAttempt = new Date(oldestOtp.created_at.getTime() + 30 * 60 * 1000);
        
        throw new BadRequestException(
          `Too many password reset requests. Please try again after ${nextAttempt.toISOString()}`,
        );
      }

      // Generate OTP
      const otpCode = this.generateOtpCode();
      const expiryMinutes = this.OTP_EXPIRY_MINUTES.password_reset;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Save OTP
      await this.prisma.otp_tokens.create({
        data: {
          user_id: user.id,
          email,
          otp_code: otpCode,
          type: 'password_reset',
          expires_at: expiresAt,
        },
      });

      // Send OTP via email
      await this.emailService.sendPasswordResetEmail(email, otpCode, user.name);

      this.logger.log(`Password reset OTP requested for ${email}`);

      return {
        success: true,
        message: 'If this email is registered, you will receive a password reset code.',
      };
    } catch (error) {
      this.logger.error(`Failed to request password reset OTP for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Verify password reset OTP
   */
  async verifyPasswordResetOtp(email: string, otpCode: string): Promise<{
    success: boolean;
    message: string;
    userId: string;
  }> {
    try {
      if (!otpCode || otpCode.length !== this.OTP_LENGTH) {
        throw new BadRequestException(
          `Invalid OTP format. Expected ${this.OTP_LENGTH} digits.`,
        );
      }

      // Find valid OTP
      const otp = await this.prisma.otp_tokens.findFirst({
        where: {
          email,
          otp_code: otpCode,
          type: 'password_reset',
          is_used: false,
          expires_at: {
            gte: new Date(),
          },
        },
      });

      if (!otp) {
        this.logger.warn(`Invalid or expired password reset OTP for ${email}`);
        throw new UnauthorizedException(
          'Invalid or expired OTP. Please request a new code.',
        );
      }

      // Mark as used
      await this.prisma.otp_tokens.update({
        where: { id: otp.id },
        data: { is_used: true },
      });

      this.logger.log(`Password reset OTP verified for ${email}`);

      return {
        success: true,
        message: 'OTP verified. You can now reset your password.',
        userId: otp.user_id,
      };
    } catch (error) {
      this.logger.error(`Failed to verify password reset OTP for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup expired OTPs (should be run periodically)
   */
  async cleanupExpiredOtps(): Promise<{
    deleted: number;
  }> {
    try {
      const result = await this.prisma.otp_tokens.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired OTP tokens`);

      return {
        deleted: result.count,
      };
    } catch (error) {
      this.logger.error('Failed to cleanup expired OTPs:', error);
      throw error;
    }
  }

  /**
   * Get OTP status for debugging (development only)
   */
  async getOtpStatus(email: string): Promise<{
    pendingVerification: number;
    pendingPasswordReset: number;
    lastVerificationAttempt?: Date;
  }> {
    const verificationOtps = await this.prisma.otp_tokens.findMany({
      where: {
        email,
        type: 'email_verification',
        is_used: false,
        expires_at: { gte: new Date() },
      },
    });

    const passwordResetOtps = await this.prisma.otp_tokens.findMany({
      where: {
        email,
        type: 'password_reset',
        is_used: false,
        expires_at: { gte: new Date() },
      },
    });

    const allOtps = await this.prisma.otp_tokens.findMany({
      where: { email },
      orderBy: { created_at: 'desc' },
      take: 1,
    });

    return {
      pendingVerification: verificationOtps.length,
      pendingPasswordReset: passwordResetOtps.length,
      lastVerificationAttempt: allOtps[0]?.created_at,
    };
  }
}
