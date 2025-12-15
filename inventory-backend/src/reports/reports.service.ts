import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    return 0;
  }

  /* 1️⃣ Daily sales summary */
  async dailySales(shopId: string, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const sales = await this.prisma.sales.aggregate({
      where: {
        shop_id: shopId,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total_amount: true,
      },
      _count: true,
    });

    return {
      date: start.toISOString().slice(0, 10),
      totalSales: this.toNumber(sales._sum.total_amount),
      totalOrders: sales._count,
    };
  }

  /* 2️⃣ Sales by date range */
  async salesByRange(shopId: string, from: Date, to: Date) {
    return this.prisma.sales.findMany({
      where: {
        shop_id: shopId,
        created_at: {
          gte: from,
          lte: to,
        },
      },
      include: {
        sale_items: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /* 3️⃣ Low stock report */
  async lowStock(shopId: string) {
    return this.prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        quantity_available: {
          lte: 5, // configurable later
        },
      },
      include: {
        products: true,
      },
      orderBy: {
        quantity_available: 'asc',
      },
    });
  }

  /* 4️⃣ Profit estimation (simple) */
  async profitEstimate(shopId: string, from: Date, to: Date) {
    const sales = await this.prisma.sale_items.aggregate({
      where: {
        sales: {
          shop_id: shopId,
          created_at: { gte: from, lte: to },
        },
      },
      _sum: {
        selling_price: true,
      },
    });

    const purchases = await this.prisma.purchase_items.aggregate({
      where: {
        purchases: {
          shop_id: shopId,
          created_at: { gte: from, lte: to },
        },
      },
      _sum: {
        cost_price: true,
      },
    });

    const revenue = this.toNumber(sales._sum.selling_price);
    const cost = this.toNumber(purchases._sum.cost_price);

    return {
      revenue,
      cost,
      profit: revenue - cost,
    };
  }
}
