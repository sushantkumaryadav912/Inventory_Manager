import { Module } from '@nestjs/common';
import { NeonJwtStrategy } from './neon.strategy';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [NeonJwtStrategy],
})
export class AuthModule {}
