import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class NeonJwtStrategy extends PassportStrategy(Strategy, 'neon') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: process.env.NEON_JWKS_URL!,
        cache: true,
        rateLimit: true,
      }),
    });
  }

  validate(payload: any) {
    return {
      userId: payload.sub,     // Neon Auth user id
      email: payload.email,    // Neon Auth email
      name: payload.name ?? null, // OAuth name (may be null)
    };
  }
}
