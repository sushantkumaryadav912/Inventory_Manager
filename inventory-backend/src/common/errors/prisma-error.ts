import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      throw new ConflictException('Duplicate record');
    }

    // Foreign key constraint
    if (error.code === 'P2003') {
      throw new BadRequestException('Invalid reference');
    }
  }

  throw error;
}
