import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSale(params: {
    shopId: string;
    userId: string;
    customerId?: string;
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK';
    items: {
      productId: string;
      quantity: number;
      sellingPrice: number;
    }[];
  }) {
    const { shopId, userId, customerId, paymentMethod, items } = params;

    return this.prisma.$transaction(async (tx) => {
      // 1. Pre-check inventory for all items
      for (const item of items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            shop_id: shopId,
            product_id: item.productId,
          },
        });

        const available = inventory?.quantity_available ?? 0;
        if (available < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}`,
          );
        }
      }

      // 2. Calculate total amount
      const totalAmount = items.reduce(
        (sum, i) => sum + i.quantity * i.sellingPrice,
        0,
      );

      // 3. Create sale header
      const sale = await tx.sales.create({
        data: {
          shop_id: shopId,
          customer_id: customerId,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          created_by: userId,
        },
      });

      // 4. Process each item
      for (const item of items) {
        // Create sale item
        await tx.sale_items.create({
          data: {
            sale_id: sale.id,
            product_id: item.productId,
            quantity: item.quantity,
            selling_price: item.sellingPrice,
          },
        });

        // Update inventory snapshot
        const inventory = await tx.inventory.findFirst({
          where: {
            shop_id: shopId,
            product_id: item.productId,
          },
        });

        const currentQty = inventory?.quantity_available ?? 0;
        const nextQty = currentQty - item.quantity;

        if (nextQty < 0) {
          throw new BadRequestException(
            `Race condition detected for product ${item.productId}`,
          );
        }

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity_available: nextQty,
              last_updated: new Date(),
            },
          });
        } else {
          // Shouldn't happen because of the pre-check, but keeps the transaction consistent.
          throw new BadRequestException(
            `Inventory row missing for product ${item.productId}`,
          );
        }

        // Create stock movement (OUT)
        await tx.stock_movements.create({
          data: {
            shop_id: shopId,
            product_id: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            source: 'SALE',
            reference_id: sale.id,
            created_by: userId,
          },
        });
      }

      return {
        saleId: sale.id,
        totalAmount,
        itemCount: items.length,
      };
    });
  }

  async listSales(shopId: string) {
    return this.prisma.sales.findMany({
      where: { shop_id: shopId },
      include: {
        sale_items: true,
        customers: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
