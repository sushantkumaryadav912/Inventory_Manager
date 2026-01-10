// src/services/api/authService.js
import apiClient from './apiClient';
import secureStorage from '../storage/secureStorage';

/**
 * AuthService
 *
 * Communicates with backend auth endpoints using custom JWT authentication.
 *
 * Expected backend routes:
 *  POST /auth/signup   (body: { email, password, name })
 *  POST /auth/login    (body: { email, password })
 *
 *  GET  /auth/me       (Authorization: Bearer <accessToken>)
 *    -> { user }
 *
 *  POST /auth/logout   (optional)
 *  POST /auth/refresh  (body: { refreshToken })
 */
class AuthService {
  /**
   * Sign up with email and password
   */
  async signUp(email, password, name) {
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      name,
    });
    return response.data; // { token, user, expiresIn }
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data; // { token, user, expiresIn }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data; // { user }
  }

  /**
   * Logout (invalidate session)
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Server logout failed:', error);
    }
  }

  /**
   * Request OTP (for email verification or password reset)
   */
  async requestOtp(email, type = 'email_verification', name) {
    const response = await apiClient.post('/auth/request-otp', {
      email,
      type,
      name,
    });
    return response.data; // { success, message }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email, otpCode, type = 'email_verification') {
    const response = await apiClient.post('/auth/verify-otp', {
      email,
      otp_code: otpCode,
      type,
    });
    return response.data; // { success, message }
  }

  /**
   * Request password reset (reset-link email)
   */
  async requestPasswordReset(email) {
    const response = await apiClient.post('/auth/request-password-reset', {
      email,
    });
    return response.data; // { success, message }
  }

  /**
   * Reset password using reset token (from email link)
   */
  async resetPasswordWithToken(userId, token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', {
      userId,
      token,
      newPassword,
    });
    return response.data; // { success, message }
  }

  /**
   * Get stored access token
   */
  async getToken() {
    const stored = await secureStorage.getAuth();
    return stored?.accessToken || null;
  }
}

export default new AuthService();
