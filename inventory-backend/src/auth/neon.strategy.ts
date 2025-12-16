import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class NeonJwtStrategy extends PassportStrategy(Strategy, 'neon') {
  private readonly logger = new Logger(NeonJwtStrategy.name);

  constructor() {
    if (!process.env.NEON_JWKS_URL) {
      throw new Error(
        'NEON_JWKS_URL is not set. Add it to your environment variables.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: process.env.NEON_JWKS_URL,
        cache: true,
        cacheMaxAge: 600000, // 10 minutes
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      passReqToCallback: false,
    });

    this.logger.log(`✓ Neon JWT Strategy initialized with JWKS: ${process.env.NEON_JWKS_URL}`);
  }

  validate(payload: any) {
    if (!payload || !payload.sub) {
      this.logger.error('Invalid JWT payload: missing subject (sub)');
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,     // Neon Auth user id
      email: payload.email,    // Neon Auth email
      name: payload.name ?? null, // OAuth name (may be null)
    };
  }
}
