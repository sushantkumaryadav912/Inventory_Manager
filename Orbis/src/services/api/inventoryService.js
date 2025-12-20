// src/services/api/inventoryService.js
import apiClient from './apiClient';

class InventoryService {
  /**
   * Get all inventory items for current shop
   */
  async getItems(params = {}) {
    try {
      const response = await apiClient.get('/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      throw error;
    }
  }

  /**
   * Get single item by ID
   */
  async getItemById(itemId) {
    try {
      const response = await apiClient.get(`/inventory/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch item:', error);
      throw error;
    }
  }

  /**
   * Create new inventory item
   */
  async createItem(itemData) {
    try {
      const response = await apiClient.post('/inventory', itemData);
      return response.data;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateItem(itemId, itemData) {
    try {
      const response = await apiClient.patch(`/inventory/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item
   */
  async deleteItem(itemId) {
    try {
      const response = await apiClient.delete(`/inventory/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }

  /**
   * Adjust stock for item (OWNER/MANAGER only)
   */
  async adjustStock(adjustmentData) {
    try {
      const response = await apiClient.post('/inventory/adjust', adjustmentData);
      return response.data;
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      throw error;
    }
  }

  /**
   * Get stock movements/history
   */
  async getStockHistory(itemId, params = {}) {
    try {
      const response = await apiClient.get(`/inventory/${itemId}/history`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stock history:', error);
      throw error;
    }
  }

  /**
   * Bulk import items
   */
  async bulkImport(items) {
    try {
      const response = await apiClient.post('/inventory/bulk-import', { items });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk import:', error);
      throw error;
    }
  }
}

export default new InventoryService();
