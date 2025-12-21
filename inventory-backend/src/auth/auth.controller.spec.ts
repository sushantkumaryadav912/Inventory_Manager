import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NeonAuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';

// Mock PrismaService
const mockPrismaService = {
    users: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
    user_shops: {
        findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
};

// Mock AuthGuard
const mockNeonAuthGuard = {
    canActivate: jest.fn(() => true),
};

describe('AuthController', () => {
    let controller: AuthController;

    beforeAll(() => {
        process.env.NEON_JWKS_URL = 'https://example.com/.well-known/jwks.json';
        process.env.NEON_CALLBACK_REDIRECT_URL = 'orbis://auth/neon/callback';
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
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
            .compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should have login method', () => {
        expect(controller.login).toBeDefined();
    });
});
