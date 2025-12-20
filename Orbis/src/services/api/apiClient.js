// src/services/api/apiClient.js
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import ENV from '../../config/env';
import secureStorage from '../storage/secureStorage';
import { handleApiError } from '../../utils/errorHandler';

const getLanHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.developer?.url ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0];
};

const resolveApiBaseUrl = () => {
  let baseUrl = ENV.API_BASE_URL?.trim();

  if (!baseUrl) {
    console.warn('API_BASE_URL is not set. Falling back to http://localhost:3000');
    baseUrl = 'http://localhost:3000';
  }

  if (__DEV__ && baseUrl.includes('localhost')) {
    const lanHost = getLanHost();

    if (lanHost) {
      baseUrl = baseUrl.replace('localhost', lanHost);
    } else if (Platform.OS === 'android') {
      baseUrl = baseUrl.replace('localhost', '10.0.2.2');
    }
  }

  return baseUrl.replace(/\/+$/, '');
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
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
        const { accessToken, shopId, user } = authData;

        // Add Authorization header using stored token
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add x-shop-id header if available on the session
        const resolvedShopId = shopId || user?.shopId;
        if (resolvedShopId) {
          config.headers['x-shop-id'] = resolvedShopId;
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
