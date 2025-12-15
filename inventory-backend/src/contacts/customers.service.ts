import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCustomerDto } from './contacts.schemas';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(shopId: string, data: CreateCustomerDto) {
    return this.prisma.customers.create({
      data: {
        shop_id: shopId,
        ...data,
      },
    });
  }

  list(shopId: string) {
    return this.prisma.customers.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
    });
  }
}
