// src/services/api/authService.js
import apiClient from './apiClient';
import secureStorage from '../storage/secureStorage';

/**
 * AuthService
 *
 * These endpoints are implemented in YOUR backend,
 * which internally uses Neon Auth for email/password. [web:105][web:114]
 *
 * Expected backend routes:
 *  POST /auth/signup
 *  POST /auth/login
 *
 *  GET  /auth/me      (Authorization: Bearer <accessToken>)
 *    -> { user }
 *
 *  POST /auth/logout  (optional)
 */
class AuthService {
  async signUp() {
    const response = await apiClient.post('/auth/signup');
    return response.data; // { user }
  }

  async login() {
    const response = await apiClient.post('/auth/login');
    return response.data; // { user }
  }

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data; // { user }
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Server logout failed:', error);
    }
  }

  async getToken() {
    const stored = await secureStorage.getAuth();
    return stored?.accessToken || null;
  }
}

export default new AuthService();
