import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NeonAuthGuard } from './auth.guard';
import { OtpThrottlerGuard } from './otp-throttler.guard';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { PasswordResetService } from './password-reset.service';
import { EmailValidatorService } from './email-validator.service';

// Mock PrismaService
const mockPrismaService = {
    users: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
    },
    user_shops: {
        findFirst: jest.fn(),
    },
    email_verification_logs: {
        create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
};

const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
};

const mockOtpService = {
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
};

const mockPasswordResetService = {
    requestPasswordReset: jest.fn(),
    resetPasswordWithToken: jest.fn(),
};

const mockEmailValidatorService = {
    validateEmail: jest.fn(),
    generateVerificationToken: jest.fn(),
    getVerificationUrl: jest.fn(),
    getVerificationTokenExpiry: jest.fn(),
};

// Mock AuthGuard
const mockNeonAuthGuard = {
    canActivate: jest.fn(() => true),
};

const mockOtpThrottlerGuard = {
    canActivate: jest.fn(() => true),
};

describe('AuthController', () => {
    let controller: AuthController;

    beforeAll(() => {
        process.env.NEON_JWKS_URL = 'https://example.com/.well-known/jwks.json';
        process.env.NEON_CALLBACK_REDIRECT_URL = 'orbis://auth/neon/callback';
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: OtpService,
                    useValue: mockOtpService,
                },
                {
                    provide: PasswordResetService,
                    useValue: mockPasswordResetService,
                },
                {
                    provide: EmailValidatorService,
                    useValue: mockEmailValidatorService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                // We might not need to provide the Guard if we just test the controller methods directly,
                // but if we used global guards we would. 
                // UseGuards decorator uses the class, so we might need to override it?
                // Actually, for unit testing controller methods, guards are usually bypassed unless using supertest (e2e).
                // For unit tests, we simply check instantiation.
            ],
        })
            .overrideGuard(NeonAuthGuard)
            .useValue(mockNeonAuthGuard)
            .overrideGuard(OtpThrottlerGuard)
            .useValue(mockOtpThrottlerGuard)
            .compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should have login method', () => {
        expect(controller.login).toBeDefined();
    });

    it('should include phone in getCurrentUser response', async () => {
        mockPrismaService.users.findUnique.mockResolvedValueOnce({
            id: 'user-1',
            email: 'user@example.com',
            name: 'User',
            phone: '+15551234567',
            user_shops: [
                {
                    shop_id: 'shop-1',
                    role: 'OWNER',
                    shops: {
                        name: 'My Shop',
                    },
                },
            ],
        });

        const res = await controller.getCurrentUser({
            user: { userId: 'user-1', email: 'user@example.com', name: 'User' },
        } as any);

        expect(res.user).toMatchObject({
            id: 'user-1',
            email: 'user@example.com',
            name: 'User',
            phone: '+15551234567',
            shopId: 'shop-1',
            shopName: 'My Shop',
            role: 'OWNER',
        });
    });

    it('should return phone as null when user record is missing', async () => {
        mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

        const res = await controller.getCurrentUser({
            user: { userId: 'missing', email: 'missing@example.com', name: 'Missing' },
        } as any);

        expect(res.user).toMatchObject({
            id: 'missing',
            email: 'missing@example.com',
            name: 'Missing',
            phone: null,
            shopId: null,
            shopName: null,
            role: null,
        });
    });
});
