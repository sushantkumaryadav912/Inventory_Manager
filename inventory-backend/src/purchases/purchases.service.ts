import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async createPurchase(params: {
    shopId: string;
    userId: string;
    supplierId?: string;
    items: {
      productId: string;
      quantity: number;
      costPrice: number;
    }[];
  }) {
    const { shopId, userId, supplierId, items } = params;

    return this.prisma.$transaction(async (tx) => {
      // 1. Calculate total cost
      const totalCost = items.reduce(
        (sum, i) => sum + i.quantity * i.costPrice,
        0,
      );

      // 2. Create purchase header
      const purchase = await tx.purchases.create({
        data: {
          shop_id: shopId,
          supplier_id: supplierId,
          total_cost: totalCost,
          created_by: userId,
        },
      });

      // 3. Process each item
      for (const item of items) {
        // Create purchase item
        await tx.purchase_items.create({
          data: {
            purchase_id: purchase.id,
            product_id: item.productId,
            quantity: item.quantity,
            cost_price: item.costPrice,
          },
        });

        // Read current inventory
        const inventory = await tx.inventory.findFirst({
          where: {
            shop_id: shopId,
            product_id: item.productId,
          },
        });

        const currentQty = inventory?.quantity_available ?? 0;
        const nextQty = currentQty + item.quantity;

        // Update/create inventory snapshot
        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity_available: nextQty,
              last_updated: new Date(),
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              shop_id: shopId,
              product_id: item.productId,
              quantity_available: nextQty,
            },
          });
        }

        // Create stock movement (IN)
        await tx.stock_movements.create({
          data: {
            shop_id: shopId,
            product_id: item.productId,
            type: 'IN',
            quantity: item.quantity,
            source: 'PURCHASE',
            reference_id: purchase.id,
            created_by: userId,
          },
        });
      }

      return {
        purchaseId: purchase.id,
        totalCost,
        itemCount: items.length,
      };
    });
  }

  async listPurchases(shopId: string) {
    return this.prisma.purchases.findMany({
      where: { shop_id: shopId },
      include: {
        purchase_items: true,
        suppliers: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPurchaseById(shopId: string, purchaseId: string) {
    return this.prisma.purchases.findFirst({
      where: {
        id: purchaseId,
        shop_id: shopId,
      },
      include: {
        purchase_items: {
          include: {
            products: true,
          },
        },
        suppliers: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
