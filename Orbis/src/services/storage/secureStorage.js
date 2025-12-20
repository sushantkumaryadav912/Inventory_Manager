// src/services/storage/secureStorage.js
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../../utils/constants';

class SecureStorageService {
  async saveAuth(authData) {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.AUTH,
        JSON.stringify(authData)
      );
      return true;
    } catch (error) {
      console.error('Failed to save auth data:', error);
      return false;
    }
  }

  async getAuth() {
    try {
      const authData = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH);
      return authData ? JSON.parse(authData) : null;
    } catch (error) {
      console.error('Failed to retrieve auth data:', error);
      return null;
    }
  }

  async clearAuth() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH);
      return true;
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      return false;
    }
  }

  async saveItem(key, value) {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  async deleteItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
      return false;
    }
  }

  async clearAll() {
    try {
      // Clear all known keys
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
      return true;
    } catch (error) {
      console.error('Failed to clear all secure storage:', error);
      return false;
    }
  }
}

export default new SecureStorageService();
