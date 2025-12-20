import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredKey = this.config.get<string>('NEON_API_KEY');
    if (!requiredKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey =
      request.headers['x-neon-api-key'] ?? request.headers['x-api-key'];

    if (typeof providedKey !== 'string' || providedKey !== requiredKey) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    return true;
  }
}
