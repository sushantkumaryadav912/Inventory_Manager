import { Module } from '@nestjs/common';
import { NeonJwtStrategy } from './neon.strategy';
import { AuthController } from './auth.controller';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  controllers: [AuthController],
  providers: [NeonJwtStrategy, ApiKeyGuard],
})
export class AuthModule {}
