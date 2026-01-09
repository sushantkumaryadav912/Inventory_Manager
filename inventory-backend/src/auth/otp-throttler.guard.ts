import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class OtpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwardedFor = req?.headers?.['x-forwarded-for'];
    const forwardedIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : Array.isArray(forwardedFor)
          ? String(forwardedFor[0]).split(',')[0]?.trim()
          : undefined;

    const ip = forwardedIp || req?.ip || req?.socket?.remoteAddress || 'unknown-ip';

    const emailRaw = req?.body?.email;
    const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';

    // Throttle by IP + email (falls back to IP-only if email missing)
    return email ? `${ip}:${email}` : String(ip);
  }
}
