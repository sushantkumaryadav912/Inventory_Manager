import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ShopGuard } from '../common/guards/shop.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard, ShopGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /settings/profile - Get business profile
   */
  @Get('profile')
  async getBusinessProfile(@Request() req) {
    const shopId = req.shop.shopId;
    return this.settingsService.getBusinessProfile(shopId);
  }

  /**
   * PATCH /settings/profile - Update business profile
   */
  @Patch('profile')
  async updateBusinessProfile(@Request() req, @Body() data: any) {
    const shopId = req.shop.shopId;
    return this.settingsService.updateBusinessProfile(shopId, data);
  }

  /**
   * GET /settings/shop - Get shop settings
   */
  @Get('shop')
  async getShopSettings(@Request() req) {
    const shopId = req.shop.shopId;
    return this.settingsService.getShopSettings(shopId);
  }

  /**
   * PATCH /settings/shop - Update shop settings
   */
  @Patch('shop')
  async updateShopSettings(@Request() req, @Body() data: any) {
    const shopId = req.shop.shopId;
    return this.settingsService.updateShopSettings(shopId, data);
  }

  /**
   * GET /settings/users - Get all shop users
   */
  @Get('users')
  async getShopUsers(@Request() req) {
    const shopId = req.shop.shopId;
    return this.settingsService.getShopUsers(shopId);
  }
}
