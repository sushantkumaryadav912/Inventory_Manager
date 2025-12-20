// src/services/api/salesService.js
import apiClient from './apiClient';

class SalesService {
  /**
   * Get all sales orders
   */
  async getSalesOrders(params = {}) {
    try {
      const response = await apiClient.get('/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sales orders:', error);
      throw error;
    }
  }

  /**
   * Get single sales order by ID
   */
  async getSalesOrderById(orderId) {
    try {
      const response = await apiClient.get(`/sales/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sales order:', error);
      throw error;
    }
  }

  /**
   * Create new sales order
   */
  async createSalesOrder(orderData) {
    try {
      const response = await apiClient.post('/sales', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create sales order:', error);
      throw error;
    }
  }

  /**
   * Update sales order
   */
  async updateSalesOrder(orderId, orderData) {
    try {
      const response = await apiClient.patch(`/sales/${orderId}`, orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to update sales order:', error);
      throw error;
    }
  }

  /**
   * Delete sales order
   */
  async deleteSalesOrder(orderId) {
    try {
      const response = await apiClient.delete(`/sales/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete sales order:', error);
      throw error;
    }
  }

  /**
   * Get all customers
   */
  async getCustomers(params = {}) {
    try {
      const response = await apiClient.get('/customers', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  }

  /**
   * Create customer
   */
  async createCustomer(customerData) {
    try {
      const response = await apiClient.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }
}

export default new SalesService();
