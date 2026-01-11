import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value && typeof (value as any).toNumber === 'function') {
      return (value as any).toNumber();
    }
    return 0;
  }

  /**
   * Get business profile (shop details)
   */
  async getBusinessProfile(shopId: string) {
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        business_type: true,
        owner_name: true,
        email: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        gst_number: true,
        phone: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return {
      id: shop.id,
      businessName: shop.name,
      ownerName: shop.owner_name || '',
      email: shop.email || '',
      businessType: shop.business_type || '',
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      pincode: shop.pincode || '',
      phone: shop.phone || '',
      gstNumber: shop.gst_number || '',
    };
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(
    shopId: string,
    data: {
      businessName?: string;
      ownerName?: string;
      businessType?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      phone?: string;
      email?: string;
      gstNumber?: string;
    },
  ) {
    const updateData: any = {};
    if (data.businessName !== undefined) updateData.name = data.businessName;
    if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
    if (data.businessType !== undefined) updateData.business_type = data.businessType;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.gstNumber !== undefined) updateData.gst_number = data.gstNumber;

    const shop = await this.prisma.shops.update({
      where: { id: shopId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        business_type: true,
        owner_name: true,
        email: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        gst_number: true,
        phone: true,
      },
    });

    return {
      id: shop.id,
      businessName: shop.name,
      ownerName: shop.owner_name || '',
      businessType: shop.business_type || '',
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      pincode: shop.pincode || '',
      phone: shop.phone || '',
      email: shop.email || '',
      gstNumber: shop.gst_number || '',
    };
  }

  /**
   * Get shop settings
   */
  async getShopSettings(shopId: string) {
    const shop = await this.prisma.shops.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        currency: true,
        tax_rate: true,
        low_stock_threshold: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return {
      shopName: shop.name,
      currency: shop.currency || 'INR',
      taxRate: this.toNumber(shop.tax_rate),
      lowStockThreshold: shop.low_stock_threshold ?? 10,
    };
  }

  /**
   * Update shop settings
   */
  async updateShopSettings(
    shopId: string,
    data: {
      shopName?: string;
      currency?: string;
      taxRate?: number;
      lowStockThreshold?: number;
    },
  ) {
    const updateData: any = {};
    if (data.shopName !== undefined) updateData.name = data.shopName;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.taxRate !== undefined && Number.isFinite(data.taxRate)) {
      updateData.tax_rate = data.taxRate;
    }
    if (data.lowStockThreshold !== undefined && Number.isFinite(data.lowStockThreshold)) {
      updateData.low_stock_threshold = data.lowStockThreshold;
    }

    const shop = await this.prisma.shops.update({
      where: { id: shopId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        name: true,
        currency: true,
        tax_rate: true,
        low_stock_threshold: true,
      },
    });

    return {
      shopName: shop.name,
      currency: shop.currency || 'INR',
      taxRate: this.toNumber(shop.tax_rate),
      lowStockThreshold: shop.low_stock_threshold ?? 10,
    };
  }

  /**
   * Get all users for a shop
   */
  async getShopUsers(shopId: string) {
    const userShops = await this.prisma.user_shops.findMany({
      where: { shop_id: shopId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            created_at: true,
          },
        },
      },
    });

    return userShops
      .filter((us) => us.users !== null)
      .map((us) => ({
        id: us.users!.id,
        name: us.users!.name,
        email: us.users!.email,
        role: us.role,
        createdAt: us.users!.created_at,
      }));
  }

  /**
   * Update user's own account information
   */
  async updateUserAccount(
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
    },
  ) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;

    // Add updated_at timestamp
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
    }

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updated_at: true,
      },
    });

    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      updatedAt: user.updated_at,
    };
  }
}
