import {
  BadGatewayException,
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NeonJwtStrategy } from './neon.strategy';

class EmailVerificationRequiredError extends Error {
  constructor(message?: string) {
    super(message || 'Email verification required');
  }
}

type MobileAuthUser = {
  id: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  shopId: string;
};

type MobileAuthSuccessResponse = {
  accessToken: string;
  user: MobileAuthUser;
};

type MobileAuthVerificationRequiredResponse = {
  verificationRequired: true;
};

@Controller('auth/mobile')
export class MobileAuthController {
  private readonly logger = new Logger(MobileAuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string; name?: string },
  ): Promise<MobileAuthSuccessResponse | MobileAuthVerificationRequiredResponse> {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password;
    const name = (body.name || '').trim() || undefined;

    if (!email) throw new BadRequestException('Email is required');
    if (!password) throw new BadRequestException('Password is required');

    const neon = this.getNeonAuthConfig();
    try {
      const { cookieHeader } = await this.neonSignUpEmail(neon, { email, password, name });
      const accessToken = await this.neonGetJwtToken(neon, cookieHeader);
      const neonUser = await this.verifyNeonAccessToken(accessToken);
      const appUser = await this.syncUserAndEnsureShop(neonUser);

      return {
        accessToken,
        user: appUser,
      };
    } catch (err) {
      if (err instanceof EmailVerificationRequiredError) {
        return { verificationRequired: true };
      }
      throw err;
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<MobileAuthSuccessResponse | MobileAuthVerificationRequiredResponse> {
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password;

    if (!email) throw new BadRequestException('Email is required');
    if (!password) throw new BadRequestException('Password is required');

    const neon = this.getNeonAuthConfig();
    try {
      const { cookieHeader } = await this.neonSignInEmail(neon, { email, password });
      const accessToken = await this.neonGetJwtToken(neon, cookieHeader);
      const neonUser = await this.verifyNeonAccessToken(accessToken);
      const appUser = await this.syncUserAndEnsureShop(neonUser);

      return {
        accessToken,
        user: appUser,
      };
    } catch (err) {
      if (err instanceof EmailVerificationRequiredError) {
        return { verificationRequired: true };
      }
      throw err;
    }
  }

  private getNeonAuthConfig(): { baseUrl: string; origin: string } {
    const baseUrl =
      this.config.get<string>('NEON_AUTH_BASE_URL') ||
      process.env.NEON_AUTH_BASE_URL ||
      process.env.NEON_AUTH_URL;

    if (!baseUrl) {
      throw new InternalServerErrorException(
        'NEON_AUTH_BASE_URL is not set (required for /auth/mobile/*)',
      );
    }

    const origin =
      this.config.get<string>('NEON_AUTH_ORIGIN') ||
      process.env.NEON_AUTH_ORIGIN ||
      baseUrl;

    return { baseUrl: baseUrl.replace(/\/$/, ''), origin };
  }

  private async neonSignUpEmail(
    neon: { baseUrl: string; origin: string },
    input: { email: string; password: string; name?: string },
  ): Promise<{ cookieHeader: string }> {
    const url = new URL('/sign-up/email', neon.baseUrl).toString();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: input.name ?? input.email,
        email: input.email,
        password: input.password,
        rememberMe: true,
      }),
    });

    if (!res.ok) {
      await this.throwNeonAuthError(res);
    }

    const cookieHeader = this.buildCookieHeader(res);
    if (!cookieHeader) {
      throw new BadGatewayException('Neon Auth did not return a session cookie');
    }

    return { cookieHeader };
  }

  private async neonSignInEmail(
    neon: { baseUrl: string; origin: string },
    input: { email: string; password: string },
  ): Promise<{ cookieHeader: string }> {
    const url = new URL('/sign-in/email', neon.baseUrl).toString();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        rememberMe: true,
      }),
    });

    if (!res.ok) {
      await this.throwNeonAuthError(res);
    }

    const cookieHeader = this.buildCookieHeader(res);
    if (!cookieHeader) {
      throw new BadGatewayException('Neon Auth did not return a session cookie');
    }

    return { cookieHeader };
  }

  private async neonGetJwtToken(
    neon: { baseUrl: string; origin: string },
    cookieHeader: string,
  ): Promise<string> {
    const url = new URL('/token', neon.baseUrl).toString();

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: cookieHeader,
        Origin: neon.origin,
      },
    });

    if (!res.ok) {
      await this.throwNeonAuthError(res);
    }

    const data: unknown = await res.json().catch(() => null);
    const token =
      typeof data === 'object' && data && 'token' in data
        ? (data as any).token
        : null;

    if (!token || typeof token !== 'string') {
      throw new BadGatewayException('Neon Auth did not return a JWT token');
    }

    return token;
  }

  private buildCookieHeader(res: Response): string {
    const headers: any = res.headers;
    const setCookies: string[] =
      typeof headers.getSetCookie === 'function'
        ? headers.getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie') as string]
          : [];

    // Convert Set-Cookie headers into a single Cookie header: "a=1; b=2"
    const pairs = setCookies
      .map((value) => value.split(';')[0]?.trim())
      .filter((value): value is string => Boolean(value));

    return pairs.join('; ');
  }

  private async throwNeonAuthError(res: Response): Promise<never> {
    const status = res.status;
    const bodyText = await res.text().catch(() => '');
    let message: string | undefined;

    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
        message = parsed.message;
      }
    } catch {
      // ignore
    }

    const effectiveMessage = message || bodyText || `Neon Auth error (${status})`;

    // Map common Better Auth errors to client-friendly responses
    if (status === 403 && /EMAIL_NOT_VERIFIED/i.test(effectiveMessage)) {
      throw new EmailVerificationRequiredError(effectiveMessage);
    }

    if (status === 401) {
      throw new UnauthorizedException(effectiveMessage);
    }

    this.logger.warn(`Neon Auth request failed: ${status} ${effectiveMessage}`);
    throw new BadGatewayException(effectiveMessage);
  }

  private async verifyNeonAccessToken(token: string): Promise<{
    userId: string;
    email: string;
    name?: string | null;
  }> {
    // Reuse the same JWKS verification logic as the NeonAuthGuard.
    // Important: do not mutate the singleton provider instance; create a per-call strategy.
    const strategy: any = new NeonJwtStrategy() as any;
    const req = { headers: { authorization: `Bearer ${token}` } } as any;

    return new Promise((resolve, reject) => {
      strategy.success = (user: any) => resolve(user);
      strategy.fail = (info: any) =>
        reject(new UnauthorizedException(info?.message || 'Invalid token'));
      strategy.error = (err: any) =>
        reject(err || new UnauthorizedException('Invalid token'));
      strategy.authenticate(req, { session: false });
    });
  }

  private async syncUserAndEnsureShop(neonUser: {
    userId: string;
    email: string;
    name?: string | null;
  }): Promise<MobileAuthUser> {
    const { userId, email, name } = neonUser;

    return this.prisma.$transaction(async (tx) => {
      await tx.users.upsert({
        where: { id: userId },
        update: {
          email,
          ...(name ? { name } : {}),
          updated_at: new Date(),
        },
        create: {
          id: userId,
          email,
          name: name ?? null,
        },
      });

      const existingUserShop = await tx.user_shops.findFirst({
        where: { user_id: userId },
        include: { shops: true },
      });

      if (existingUserShop?.shop_id && existingUserShop.role) {
        return {
          id: userId,
          email,
          role: existingUserShop.role,
          shopId: existingUserShop.shop_id,
        };
      }

      const shop = await tx.shops.create({
        data: {
          name: `${name ?? 'My'} Shop`,
          business_type: 'inventory',
        },
      });

      const userShop = await tx.user_shops.create({
        data: {
          user_id: userId,
          shop_id: shop.id,
          role: 'OWNER',
        },
      });

      return {
        id: userId,
        email,
        role: userShop.role,
        shopId: shop.id,
      };
    });
  }
}
