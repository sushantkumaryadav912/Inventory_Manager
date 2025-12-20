// src/services/api/authService.js
import apiClient from './apiClient';

/**
 * AuthService
 *
 * These endpoints are implemented in YOUR backend,
 * which internally uses Neon Auth for email/password. [web:105][web:114]
 *
 * Expected backend routes:
 *  POST /auth/signup  { name, email, password }
 *    -> { accessToken, user }
 *
 *  POST /auth/login   { email, password }
 *    -> { accessToken, user }
 *
 *  GET  /auth/me      (Authorization: Bearer <accessToken>)
 *    -> { user }
 *
 *  POST /auth/logout  (optional)
 */
class AuthService {
  async signUp({ name, email, password }) {
    const response = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
    });
    return response.data; // { accessToken, user }
  }

  async login({ email, password }) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data; // { accessToken, user }
  }

  async getCurrentUser(accessToken) {
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data; // { user }
  }

  async logout(accessToken) {
    try {
      await apiClient.post(
        '/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Server logout failed:', error);
    }
  }
}

export default new AuthService();
