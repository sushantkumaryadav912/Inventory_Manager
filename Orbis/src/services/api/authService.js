// src/services/api/authService.js
import apiClient from './apiClient';

class AuthService {
  /**
   * Onboard user with Neon token
   * Backend creates user + shop + role if needed
   */
  async onboard(neonToken) {
    try {
      const response = await apiClient.post('/auth/onboard', null, {
        headers: {
          Authorization: `Bearer ${neonToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Onboard failed:', error);
      throw error;
    }
  }

  /**
   * Validate current session (optional - call /auth/onboard again)
   * Since no dedicated /auth/me endpoint exists
   */
  async validateSession(neonToken) {
    try {
      const response = await this.onboard(neonToken);
      return response;
    } catch (error) {
      console.error('Session validation failed:', error);
      throw error;
    }
  }
}

export default new AuthService();
