import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly TOKEN_BYTES = 32;
  private readonly TOKEN_SALT_ROUNDS = 10;
  private readonly EXPIRY_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private getAppUrl(): string {
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new Error('APP_URL is required to generate password reset links.');
    }
    return appUrl.replace(/\/$/, '');
  }

  private generateResetToken(): string {
    return randomBytes(this.TOKEN_BYTES).toString('hex');
  }

  private buildResetLink(userId: string, token: string): string {
    // Keep the format simple and auditable. Frontend can deep-link and handle params.
    const base = this.getAppUrl();
    const qs = `userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
    return `${base}/reset-password?${qs}`;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    // Non-enumerable response, always identical.
    const response = {
      success: true,
      message: 'If this email is registered, you will receive a password reset link.',
    };

    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      // Deliberately do nothing (non-enumeration). No email logging.
      return response;
    }

    const token = this.generateResetToken();
    const tokenHash = await bcrypt.hash(token, this.TOKEN_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_reset_token_hash: tokenHash,
        password_reset_token_expires_at: expiresAt,
        password_reset_token_used_at: null,
      },
    });

    const resetLink = this.buildResetLink(user.id, token);

    try {
      await this.emailService.sendPasswordResetLinkEmail(user.email, resetLink, user.name ?? undefined);
    } catch (err) {
      // Do not leak; still return generic response.
      this.logger.error('Failed to send password reset email', err?.message);
    }

    return response;
  }

  async resetPasswordWithToken(params: {
    userId: string;
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const { userId, token, newPassword } = params;

    if (!userId || !token || !newPassword) {
      throw new BadRequestException('userId, token, and newPassword are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password_reset_token_hash: true,
        password_reset_token_expires_at: true,
        password_reset_token_used_at: true,
      },
    });

    if (!user || !user.password_reset_token_hash || !user.password_reset_token_expires_at) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.password_reset_token_used_at) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.password_reset_token_expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const isValid = await bcrypt.compare(token, user.password_reset_token_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await this.authService.hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          password_reset_token_used_at: new Date(),
          password_reset_token_hash: null,
          password_reset_token_expires_at: null,
        },
      });
    });

    return {
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  async cleanupExpiredResetTokens(): Promise<{ cleaned: number }> {
    const result = await this.prisma.users.updateMany({
      where: {
        OR: [
          { password_reset_token_expires_at: { lt: new Date() } },
          { password_reset_token_used_at: { not: null } },
        ],
      },
      data: {
        password_reset_token_hash: null,
        password_reset_token_expires_at: null,
      },
    });

    return { cleaned: result.count };
  }
}
