import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adjusts stock and records stock movement atomically
   */
  async adjustStock(params: {
    shopId: string;
    userId: string;
    productId: string;
    quantity: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    source: 'PURCHASE' | 'SALE' | 'DAMAGE' | 'EXPIRED' | 'MANUAL';
    referenceId?: string;
  }) {
    const {
      shopId,
      userId,
      productId,
      quantity,
      type,
      source,
      referenceId,
    } = params;

    return this.prisma.$transaction(async (tx) => {
      // Fetch current inventory row (or assume 0)
      const existing = await tx.inventory.findFirst({
        where: {
          shop_id: shopId,
          product_id: productId,
        },
      });

      const currentQty = existing?.quantity_available ?? 0;

      let nextQty = currentQty;

      if (type === 'IN') nextQty = currentQty + quantity;
      if (type === 'OUT') nextQty = currentQty - quantity;
      if (type === 'ADJUSTMENT') nextQty = quantity;

      if (nextQty < 0) {
        throw new BadRequestException('Insufficient stock');
      }

      // Update/create inventory snapshot
      if (existing) {
        await tx.inventory.update({
          where: { id: existing.id },
          data: {
            quantity_available: nextQty,
            last_updated: new Date(),
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            shop_id: shopId,
            product_id: productId,
            quantity_available: nextQty,
          },
        });
      }

      // Record stock movement
      await tx.stock_movements.create({
        data: {
          shop_id: shopId,
          product_id: productId,
          type,
          quantity,
          source,
          reference_id: referenceId,
          created_by: userId,
        },
      });

      return {
        productId,
        previousQty: currentQty,
        currentQty: nextQty,
      };
    });
  }

  /**
   * Read inventory for a shop
   */
  async getInventory(shopId: string) {
    return this.prisma.inventory.findMany({
      where: { shop_id: shopId },
      include: {
        products: true,
      },
      orderBy: {
        last_updated: 'desc',
      },
    });
  }
}
