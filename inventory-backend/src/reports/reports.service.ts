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

  private getMonthRange(now: Date = new Date()): { from: Date; to: Date } {
    const from = new Date(now);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);

    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  async overviewStats(shopId: string) {
    const { from, to } = this.getMonthRange(new Date());

    const [salesAgg, purchasesAgg, inventoryRows] = await Promise.all([
      this.prisma.sales.aggregate({
        where: { shop_id: shopId, created_at: { gte: from, lte: to } },
        _sum: { total_amount: true },
        _count: true,
      }),
      this.prisma.purchases.aggregate({
        where: { shop_id: shopId, created_at: { gte: from, lte: to } },
        _sum: { total_cost: true },
        _count: true,
      }),
      this.prisma.inventory.findMany({
        where: { shop_id: shopId },
        include: { products: true },
      }),
    ]);

    const inventoryValue = inventoryRows.reduce((sum, row) => {
      const qty = row.quantity_available ?? 0;
      const cost = this.toNumber(row.products?.cost_price);
      return sum + qty * cost;
    }, 0);

    const lowStockItems = inventoryRows.filter((row) => {
      const qty = row.quantity_available ?? 0;
      return qty > 0 && qty <= 5;
    }).length;

    const totalSales = this.toNumber(salesAgg._sum.total_amount);
    const totalPurchases = this.toNumber(purchasesAgg._sum.total_cost);
    const profit = totalSales - totalPurchases;

    return {
      totalSales,
      totalPurchases,
      inventoryValue,
      profit,
      lowStockItems,
    };
  }

  async inventoryReport(shopId: string) {
    const rows = await this.prisma.inventory.findMany({
      where: { shop_id: shopId },
      include: { products: true },
    });

    const totalItems = rows.length;
    const totalValue = rows.reduce((sum, row) => {
      const qty = row.quantity_available ?? 0;
      const cost = this.toNumber(row.products?.cost_price);
      return sum + qty * cost;
    }, 0);

    const outOfStockItems = rows.filter((row) => (row.quantity_available ?? 0) <= 0).length;
    const lowStockItems = rows.filter((row) => {
      const qty = row.quantity_available ?? 0;
      return qty > 0 && qty <= 5;
    }).length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
    };
  }

  async salesSummary(shopId: string, from?: Date, to?: Date) {
    const range = from && to ? { from, to } : this.getMonthRange(new Date());

    const salesAgg = await this.prisma.sales.aggregate({
      where: { shop_id: shopId, created_at: { gte: range.from, lte: range.to } },
      _sum: { total_amount: true },
      _count: true,
    });

    const purchasesAgg = await this.prisma.purchases.aggregate({
      where: { shop_id: shopId, created_at: { gte: range.from, lte: range.to } },
      _sum: { total_cost: true },
    });

    const totalSales = this.toNumber(salesAgg._sum.total_amount);
    const totalOrders = salesAgg._count;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const totalPurchases = this.toNumber(purchasesAgg._sum.total_cost);
    const profit = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      profitMargin: Math.round(profitMargin * 100) / 100,
    };
  }

  async purchasesSummary(shopId: string, from?: Date, to?: Date) {
    const range = from && to ? { from, to } : this.getMonthRange(new Date());

    const purchasesAgg = await this.prisma.purchases.aggregate({
      where: { shop_id: shopId, created_at: { gte: range.from, lte: range.to } },
      _sum: { total_cost: true },
      _count: true,
    });

    const suppliers = await this.prisma.purchases.findMany({
      where: { shop_id: shopId, created_at: { gte: range.from, lte: range.to } },
      distinct: ['supplier_id'],
      select: { supplier_id: true },
    });

    return {
      totalPurchases: this.toNumber(purchasesAgg._sum.total_cost),
      totalOrders: purchasesAgg._count,
      pendingOrders: 0,
      totalSuppliers: suppliers.filter((s) => !!s.supplier_id).length,
    };
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
