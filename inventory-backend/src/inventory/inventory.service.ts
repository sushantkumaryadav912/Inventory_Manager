import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInventoryItemDto, UpdateInventoryItemDto } from './inventory.schemas';

type InventoryReadClient = {
  inventory: {
    findFirst: (args: any) => Promise<any>;
  };
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    return 0;
  }

  private normalizeUnit(raw?: string): 'piece' | 'bunch' | 'kg' | 'pot' {
    const unit = (raw ?? '').trim().toLowerCase();
    if (unit === 'piece') return 'piece';
    if (unit === 'bunch') return 'bunch';
    if (unit === 'kg') return 'kg';
    if (unit === 'pot') return 'pot';
    return 'piece';
  }

  private mapInventoryRow(row: any) {
    const product = row.products;
    const categoryName = product?.categories?.name ?? undefined;

    return {
      id: product?.id ?? row.product_id,
      name: product?.name,
      sku: product?.sku,
      category: categoryName,
      description: undefined,
      quantity: row.quantity_available ?? 0,
      unit: product?.unit ?? 'piece',
      costPrice: this.toNumber(product?.cost_price),
      sellingPrice: this.toNumber(product?.selling_price),
      reorderLevel: row.reorder_level ?? 0,
    };
  }

  private async getItemByIdWithClient(
    client: InventoryReadClient,
    shopId: string,
    productId: string,
  ) {
    const row = await client.inventory.findFirst({
      where: {
        shop_id: shopId,
        product_id: productId,
        products: { is: { is_active: true } },
      },
      include: {
        products: {
          include: {
            categories: true,
          },
        },
      },
    });

    if (!row) throw new NotFoundException('Item not found');
    return this.mapInventoryRow(row);
  }

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

  async listItems(shopId: string, search?: string) {
    const normalizedSearch = search?.trim();

    const rows = await this.prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        products: {
          is: {
            is_active: true,
            ...(normalizedSearch
              ? {
                  OR: [
                    { name: { contains: normalizedSearch, mode: 'insensitive' } },
                    { sku: { contains: normalizedSearch, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
        },
      },
      include: {
        products: {
          include: {
            categories: true,
          },
        },
      },
      orderBy: {
        last_updated: 'desc',
      },
    });

    return rows.map((row) => this.mapInventoryRow(row));
  }

  async getItemById(shopId: string, productId: string) {
    return this.getItemByIdWithClient(this.prisma as unknown as InventoryReadClient, shopId, productId);
  }

  async createItem(shopId: string, userId: string, dto: CreateInventoryItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const categoryId = dto.category
        ? (
            await tx.categories.findFirst({
              where: { shop_id: shopId, name: dto.category.trim() },
              select: { id: true },
            })
          )?.id ??
          (
            await tx.categories.create({
              data: {
                shop_id: shopId,
                name: dto.category.trim(),
                description: null,
              },
              select: { id: true },
            })
          ).id
        : null;

      const product = await tx.products.create({
        data: {
          shop_id: shopId,
          category_id: categoryId,
          supplier_id: null,
          name: dto.name,
          sku: dto.sku,
          unit: this.normalizeUnit(dto.unit),
          cost_price: dto.costPrice,
          selling_price: dto.sellingPrice,
          is_active: true,
        },
        select: { id: true },
      });

      await tx.inventory.create({
        data: {
          shop_id: shopId,
          product_id: product.id,
          quantity_available: dto.quantity,
          reorder_level: dto.reorderLevel,
        },
      });

      await tx.stock_movements.create({
        data: {
          shop_id: shopId,
          product_id: product.id,
          type: 'ADJUSTMENT',
          quantity: dto.quantity,
          source: 'MANUAL',
          created_by: userId,
        },
      });

      // IMPORTANT: do not call the non-transactional Prisma client inside the transaction.
      // Read the created item using the same transaction client to avoid visibility issues.
      return this.getItemByIdWithClient(tx as unknown as InventoryReadClient, shopId, product.id);
    });
  }

  async updateItem(shopId: string, productId: string, dto: UpdateInventoryItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.products.findFirst({
        where: { id: productId, shop_id: shopId, is_active: true },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException('Item not found');

      const categoryId = dto.category
        ? (
            await tx.categories.findFirst({
              where: { shop_id: shopId, name: dto.category.trim() },
              select: { id: true },
            })
          )?.id ??
          (
            await tx.categories.create({
              data: {
                shop_id: shopId,
                name: dto.category.trim(),
                description: null,
              },
              select: { id: true },
            })
          ).id
        : undefined;

      await tx.products.update({
        where: { id: productId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(categoryId !== undefined ? { category_id: categoryId } : {}),
          ...(dto.unit ? { unit: this.normalizeUnit(dto.unit) } : {}),
          ...(dto.costPrice !== undefined ? { cost_price: dto.costPrice } : {}),
          ...(dto.sellingPrice !== undefined ? { selling_price: dto.sellingPrice } : {}),
        },
      });

      if (dto.quantity !== undefined || dto.reorderLevel !== undefined) {
        const inv = await tx.inventory.findFirst({
          where: { shop_id: shopId, product_id: productId },
          select: { id: true },
        });
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              ...(dto.quantity !== undefined ? { quantity_available: dto.quantity } : {}),
              ...(dto.reorderLevel !== undefined ? { reorder_level: dto.reorderLevel } : {}),
              last_updated: new Date(),
            },
          });
        }
      }

      return this.getItemById(shopId, productId);
    });
  }

  async deleteItem(shopId: string, productId: string) {
    const existing = await this.prisma.products.findFirst({
      where: { id: productId, shop_id: shopId, is_active: true },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Item not found');

    await this.prisma.products.update({
      where: { id: productId },
      data: { is_active: false },
    });

    return { success: true };
  }

  async getStockHistory(shopId: string, productId: string, limit: number = 10) {
    const movements = await this.prisma.stock_movements.findMany({
      where: { shop_id: shopId, product_id: productId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return movements.map((m) => {
      const qty = m.quantity ?? 0;
      const delta = m.type === 'OUT' ? -qty : qty;
      return {
        reason: `${m.source}`,
        createdAt: m.created_at?.toISOString() ?? new Date().toISOString(),
        delta,
      };
    });
  }

  async bulkImport(shopId: string, userId: string, items: CreateInventoryItemDto[]) {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const item of items) {
      const exists = await this.prisma.products.findFirst({
        where: { shop_id: shopId, sku: item.sku },
        select: { id: true },
      });
      if (exists) {
        skipped.push(item.sku);
        continue;
      }
      const createdItem = await this.createItem(shopId, userId, item);
      created.push(createdItem.id);
    }

    return { createdCount: created.length, skippedCount: skipped.length };
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
