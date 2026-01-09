import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OtpService } from './otp.service';
import { PasswordResetService } from './password-reset.service';

@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  // Every hour
  @Cron('0 * * * *')
  async cleanup() {
    try {
      const otpResult = await this.otpService.cleanupExpiredOtps();
      const resetResult = await this.passwordResetService.cleanupExpiredResetTokens();
      this.logger.log(`Cleanup complete. Expired OTPs: ${otpResult.deleted}, reset tokens: ${resetResult.cleaned}`);
    } catch (err) {
      this.logger.error('Cleanup job failed', err?.message);
    }
  }
}
