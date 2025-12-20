// src/services/api/reportsService.js
import apiClient from './apiClient';

class ReportsService {
  /**
   * Get overview report with KPIs
   */
  async getOverviewReport(params = {}) {
    try {
      const response = await apiClient.get('/reports/overview', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch overview report:', error);
      throw error;
    }
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(params = {}) {
    try {
      const response = await apiClient.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
      throw error;
    }
  }

  /**
   * Get sales report
   */
  async getSalesReport(params = {}) {
    try {
      const response = await apiClient.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      throw error;
    }
  }

  /**
   * Get purchases report
   */
  async getPurchasesReport(params = {}) {
    try {
      const response = await apiClient.get('/reports/purchases', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch purchases report:', error);
      throw error;
    }
  }
}

export default new ReportsService();
