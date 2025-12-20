// src/services/api/apiClient.js
import axios from 'axios';
import ENV from '../../config/env';
import secureStorage from '../storage/secureStorage';
import { handleApiError } from '../../utils/errorHandler';

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - inject auth headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const authData = await secureStorage.getAuth();
      
      if (authData) {
        const { neonToken, shopId } = authData;
        
        // Add Authorization header
        if (neonToken) {
          config.headers.Authorization = `Bearer ${neonToken}`;
        }
        
        // Add x-shop-id header (required by ShopGuard)
        if (shopId) {
          config.headers['x-shop-id'] = shopId;
        }
      }
    } catch (error) {
      console.error('Failed to inject auth headers:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { status } = error.response || {};
    
    // Handle 401 - token expired, force logout
    if (status === 401) {
      console.log('Session expired, clearing auth...');
      await secureStorage.clearAuth();
      // Optionally: trigger navigation to login (requires navigation ref)
    }
    
    // Handle other errors
    const handledError = handleApiError(error);
    return Promise.reject(handledError);
  }
);

export default apiClient;
