// src/services/api/settingsService.js
import apiClient from './apiClient';

class SettingsService {
  /**
   * Get business profile
   */
  async getBusinessProfile() {
    try {
      const response = await apiClient.get('/settings/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch business profile:', error);
      throw error;
    }
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(profileData) {
    try {
      const response = await apiClient.patch('/settings/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update business profile:', error);
      throw error;
    }
  }

  /**
   * Get shop settings
   */
  async getShopSettings() {
    try {
      const response = await apiClient.get('/settings/shop');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch shop settings:', error);
      throw error;
    }
  }

  /**
   * Update shop settings
   */
  async updateShopSettings(settingsData) {
    try {
      const response = await apiClient.patch('/settings/shop', settingsData);
      return response.data;
    } catch (error) {
      console.error('Failed to update shop settings:', error);
      throw error;
    }
  }

  /**
   * Get all users (OWNER only)
   */
  async getUsers() {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * Invite new user (OWNER only)
   */
  async inviteUser(userData) {
    try {
      const response = await apiClient.post('/users/invite', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  }

  /**
   * Update user role (OWNER only)
   */
  async updateUserRole(userId, role) {
    try {
      const response = await apiClient.patch(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }
}

export default new SettingsService();
