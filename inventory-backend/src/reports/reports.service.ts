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

    // Generate weekly sales data for chart
    const weeklySales = await this.getWeeklySales(shopId);

    return {
      totalSales,
      totalPurchases,
      inventoryValue,
      profit,
      lowStockItems,
      weeklySales,
    };
  }

  private async getWeeklySales(shopId: string) {
    const now = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySales: Array<{ day: string; value: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const dayData = await this.prisma.sales.aggregate({
        where: {
          shop_id: shopId,
          created_at: { gte: date, lt: nextDay },
        },
        _sum: { total_amount: true },
      });

      weeklySales.push({
        day: daysOfWeek[date.getDay()],
        value: this.toNumber(dayData._sum.total_amount),
      });
    }

    return weeklySales;
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

    // Get category distribution
    const categoryDistribution = await this.getCategoryDistribution(shopId);

    // Get top items by value
    const topItems = rows
      .map((row) => ({
        id: row.product_id,
        name: row.products?.name || 'Unknown',
        quantity: row.quantity_available ?? 0,
        value: (row.quantity_available ?? 0) * this.toNumber(row.products?.cost_price),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categoryDistribution,
      topItems,
    };
  }

  private async getCategoryDistribution(shopId: string) {
    const inventory = await this.prisma.inventory.findMany({
      where: { shop_id: shopId },
      include: {
        products: {
          include: {
            categories: true,
          },
        },
      },
    });

    const categoryMap = new Map<string, number>();

    inventory.forEach((item) => {
      const categoryName = item.products?.categories?.name || 'Uncategorized';
      const qty = item.quantity_available ?? 0;
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + qty);
    });

    return Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value,
    }));
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

    // Get monthly sales data for chart
    const monthlySales = await this.getMonthlySales(shopId);

    // Get top selling products
    const topProducts = await this.getTopProducts(shopId);

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      profitMargin: Math.round(profitMargin * 100) / 100,
      monthlySales,
      topProducts,
    };
  }

  private async getMonthlySales(shopId: string) {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales: Array<{ month: string; value: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthData = await this.prisma.sales.aggregate({
        where: {
          shop_id: shopId,
          created_at: { gte: date, lt: nextMonth },
        },
        _sum: { total_amount: true },
      });

      monthlySales.push({
        month: monthNames[date.getMonth()],
        value: this.toNumber(monthData._sum.total_amount),
      });
    }

    return monthlySales;
  }

  private async getTopProducts(shopId: string) {
    const { from, to } = this.getMonthRange(new Date());

    const topItems = await this.prisma.sale_items.groupBy({
      by: ['product_id'],
      where: {
        sales: {
          shop_id: shopId,
          created_at: { gte: from, lte: to },
        },
      },
      _sum: {
        quantity: true,
        selling_price: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProducts = await Promise.all(
      topItems.map(async (item) => {
        const product = await this.prisma.products.findUnique({
          where: { id: item.product_id },
        });

        return {
          id: (item.product_id || undefined) as string | undefined,
          name: product?.name ?? 'Unknown Product',
          quantity: item._sum.quantity ?? 0,
          revenue: this.toNumber(item._sum.selling_price),
        };
      }),
    );

    return topProducts;
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

    // Get monthly purchases data for chart
    const monthlyPurchases = await this.getMonthlyPurchases(shopId);

    // Get top suppliers
    const topSuppliers = await this.getTopSuppliers(shopId);

    return {
      totalPurchases: this.toNumber(purchasesAgg._sum.total_cost),
      totalOrders: purchasesAgg._count,
      pendingOrders: 0,
      totalSuppliers: suppliers.filter((s) => !!s.supplier_id).length,
      monthlyPurchases,
      topSuppliers,
    };
  }

  private async getMonthlyPurchases(shopId: string) {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyPurchases: Array<{ month: string; value: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthData = await this.prisma.purchases.aggregate({
        where: {
          shop_id: shopId,
          created_at: { gte: date, lt: nextMonth },
        },
        _sum: { total_cost: true },
      });

      monthlyPurchases.push({
        month: monthNames[date.getMonth()],
        value: this.toNumber(monthData._sum.total_cost),
      });
    }

    return monthlyPurchases;
  }

  private async getTopSuppliers(shopId: string) {
    const { from, to } = this.getMonthRange(new Date());

    const topSupplierData = await this.prisma.purchases.groupBy({
      by: ['supplier_id'],
      where: {
        shop_id: shopId,
        created_at: { gte: from, lte: to },
        supplier_id: { not: null },
      },
      _sum: {
        total_cost: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          total_cost: 'desc',
        },
      },
      take: 5,
    });

    const topSuppliers = await Promise.all(
      topSupplierData.map(async (item) => {
        const supplier = await this.prisma.suppliers.findUnique({
          where: { id: item.supplier_id },
        });

        return {
          id: (item.supplier_id || undefined) as string | undefined,
          name: supplier?.name ?? 'Unknown Supplier',
          orders: item._count,
          totalSpent: this.toNumber(item._sum.total_cost),
        };
      }),
    );

    return topSuppliers;
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
