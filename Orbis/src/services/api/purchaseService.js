// src/services/api/purchaseService.js
import apiClient from './apiClient';

class PurchaseService {
  /**
   * Get all purchase orders
   */
  async getPurchaseOrders(params = {}) {
    try {
      const response = await apiClient.get('/purchases', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      throw error;
    }
  }

  /**
   * Get single purchase order by ID
   */
  async getPurchaseOrderById(orderId) {
    try {
      const response = await apiClient.get(`/purchases/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchase order:', error);
      throw error;
    }
  }

  /**
   * Create new purchase order
   */
  async createPurchaseOrder(orderData) {
    try {
      const response = await apiClient.post('/purchases', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      throw error;
    }
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(orderId, orderData) {
    try {
      const response = await apiClient.patch(`/purchases/${orderId}`, orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to update purchase order:', error);
      throw error;
    }
  }

  /**
   * Delete purchase order
   */
  async deletePurchaseOrder(orderId) {
    try {
      const response = await apiClient.delete(`/purchases/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete purchase order:', error);
      throw error;
    }
  }

  /**
   * Get all suppliers
   */
  async getSuppliers(params = {}) {
    try {
      const response = await apiClient.get('/suppliers', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      throw error;
    }
  }

  /**
   * Create supplier
   */
  async createSupplier(supplierData) {
    try {
      const response = await apiClient.post('/suppliers', supplierData);
      return response.data;
    } catch (error) {
      console.error('Failed to create supplier:', error);
      throw error;
    }
  }
}

export default new PurchaseService();
