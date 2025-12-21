import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class NeonAuthGuard extends AuthGuard('neon') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // DEV BYPASS: Allow specific token in non-prod environments
        if (
            process.env.NODE_ENV !== 'production' &&
            authHeader === 'Bearer dev-token'
        ) {
            // Inject mock user
            request.user = {
                userId: 'dev-user',
                email: 'dev@aerosy.in',
                name: 'Dev User',
            };
            return true;
        }

        return super.canActivate(context);
    }
}
