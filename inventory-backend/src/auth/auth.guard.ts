import { AuthGuard } from '@nestjs/passport';

export class NeonAuthGuard extends AuthGuard('neon') {}
