import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly TOKEN_EXPIRY = 3600; // 1 hour in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against stored hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const token = this.jwtService.sign(payload, {
      expiresIn: this.TOKEN_EXPIRY,
    });
    return token;
  }

  /**
   * Sign up a new user with email and password
   */
  async signup(email: string, password: string, name?: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // Check if user already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const userId = uuidv4();
    const user = await this.prisma.users.create({
      data: {
        id: userId,
        email,
        name: name || email.split('@')[0],
        password_hash: passwordHash,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresIn: this.TOKEN_EXPIRY,
      requiresOnboarding: true, // New user needs to onboard
    };
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // Find user
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.password_hash) {
      throw new UnauthorizedException('User account not properly configured');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    // Check if user has completed onboarding
    const userShop = await this.prisma.user_shops.findFirst({
      where: { user_id: user.id },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      expiresIn: this.TOKEN_EXPIRY,
      requiresOnboarding: !userShop, // User needs onboarding if no shop assigned
    };
  }

  /**
   * Get current user by ID
   */
  async getUserById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Validate JWT token (used by JWT strategy)
   */
  async validateTokenPayload(payload: any) {
    const user = await this.getUserById(payload.sub);
    return user;
  }
}
