import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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
        address: true,
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
      businessType: shop.business_type || '',
      address: shop.address || '',
      city: '', // Not in schema, return empty
      state: '', // Not in schema, return empty
      zipCode: '', // Not in schema, return empty
      phone: shop.phone || '',
      email: '', // Not in schema, return empty
      gstNumber: '', // Not in schema, return empty
    };
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(
    shopId: string,
    data: {
      businessName?: string;
      businessType?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
  ) {
    const updateData: any = {};
    if (data.businessName) updateData.name = data.businessName;
    if (data.businessType) updateData.business_type = data.businessType;
    if (data.address) updateData.address = data.address;
    if (data.phone) updateData.phone = data.phone;

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
        address: true,
        phone: true,
      },
    });

    return {
      id: shop.id,
      businessName: shop.name,
      businessType: shop.business_type || '',
      address: shop.address || '',
      phone: shop.phone || '',
      email: data.email || '',
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
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Return default settings since we don't have a settings table yet
    return {
      shopName: shop.name,
      currency: 'INR', // Default currency
      taxRate: 0, // Default tax rate
      lowStockThreshold: 10, // Default threshold
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
    // Update shop name if provided
    if (data.shopName) {
      await this.prisma.shops.update({
        where: { id: shopId },
        data: {
          name: data.shopName,
          updated_at: new Date(),
        },
      });
    }

    // Return updated settings
    // For now, we just echo back what was sent since we don't have a settings table
    return {
      shopName: data.shopName,
      currency: data.currency || 'INR',
      taxRate: data.taxRate || 0,
      lowStockThreshold: data.lowStockThreshold || 10,
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
}
