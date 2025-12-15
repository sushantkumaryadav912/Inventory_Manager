import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSupplierDto } from './contacts.schemas';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(shopId: string, data: CreateSupplierDto) {
    return this.prisma.suppliers.create({
      data: {
        shop_id: shopId,
        ...data,
      },
    });
  }

  list(shopId: string) {
    return this.prisma.suppliers.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
    });
  }
}
