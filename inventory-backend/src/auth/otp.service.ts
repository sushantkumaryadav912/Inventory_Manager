import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_SALT_ROUNDS = 10;
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate a random OTP code
   */
  private generateOtpCode(): string {
    // Cryptographically secure 6-digit numeric code.
    // randomInt upper bound is exclusive.
    return String(randomInt(100_000, 1_000_000));
  }

  /**
   * Request OTP for email verification (during signup)
   */
  async requestEmailVerificationOtp(
    email: string,
    userName?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Non-enumeration: always return the same response.
      const response = {
        success: true,
        message: 'If this email is eligible, you will receive a verification code.',
      };

      // Email verification OTP is for existing users (created during signup)
      const user = await this.prisma.users.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true },
      });

      if (!user) {
        return response;
      }

      // Check if too many OTP requests in short time (rate limiting)
      const recentOtps = await this.prisma.otp_tokens.findMany({
        where: {
          email: normalizedEmail,
          type: 'email_verification',
          created_at: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // Last 2 minutes
          },
        },
        orderBy: { created_at: 'asc' },
      });

      if (recentOtps.length >= 3) {
        return response;
      }

      // Generate OTP
      const otpCode = this.generateOtpCode();
      const otpHash = await bcrypt.hash(otpCode, this.OTP_SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Save OTP to database
      await this.prisma.otp_tokens.create({
        data: {
          user_id: user.id,
          email: normalizedEmail,
          otp_code: otpHash,
          type: 'email_verification',
          expires_at: expiresAt,
        },
      });

      // Send OTP via email
      const sent = await this.emailService.sendOtpEmail(normalizedEmail, otpCode, userName);
      if (!sent) {
        this.logger.warn(
          `OTP generated for ${normalizedEmail} but email was not sent (email service disabled or provider error).`,
        );
      }

      this.logger.log(`Email verification OTP requested for ${normalizedEmail}`);

      return response;
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
      const normalizedEmail = email.trim().toLowerCase();

      if (!otpCode || !new RegExp(`^\\d{${this.OTP_LENGTH}}$`).test(otpCode)) {
        throw new BadRequestException(
          `Invalid OTP format. Expected ${this.OTP_LENGTH} digits.`,
        );
      }

      // Find a matching (hashed) OTP among recent, unexpired tokens
      const candidates = await this.prisma.otp_tokens.findMany({
        where: {
          email: normalizedEmail,
          type: 'email_verification',
          is_used: false,
          expires_at: {
            gte: new Date(), // Not expired
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      const otp = await (async () => {
        for (const candidate of candidates) {
          const isMatch = await bcrypt.compare(otpCode, candidate.otp_code);
          if (isMatch) return candidate;
        }
        return null;
      })();

      if (!otp) {
        this.logger.warn(`Invalid or expired OTP attempt for ${normalizedEmail}`);
        throw new UnauthorizedException(
          'Invalid or expired OTP.',
        );
      }

      // Mark OTP as used
      await this.prisma.otp_tokens.update({
        where: { id: otp.id },
        data: { is_used: true },
      });

      // Mark user as verified
      await this.prisma.users.update({
        where: { email: normalizedEmail },
        data: {
          email_verified: true,
          email_verified_at: new Date(),
        },
      });

      this.logger.log(`Email OTP verified for ${normalizedEmail}`);

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

}
