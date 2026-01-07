import ENV from '../../config/env';

/**
 * Custom Auth Client
 *
 * Replaces Neon Auth with custom JWT-based authentication.
 * Passwords are hashed and stored in the database.
 */

const API_BASE_URL = ENV.API_BASE_URL || '';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const warnMissingConfig = () => {
  const missingKeys = [];

  if (!ENV.API_BASE_URL) {
    missingKeys.push('API_BASE_URL');
  }

  if (missingKeys.length > 0) {
    console.warn(
      `[CustomAuth] Missing configuration: ${missingKeys.join(', ')}. Authentication will not work.`
    );
    return true;
  }

  return false;
};

const normalizeSession = (data) => {
  if (!data || !data.token) return null;

  const expiresAt =
    data.expiresAt ||
    (data.expiresIn
      ? Math.floor(Date.now() / 1000) + data.expiresIn
      : Math.floor(Date.now() / 1000) + 3600 * 24); // default 24 hours

  return {
    accessToken: data.token,
    refreshToken: data.refreshToken || null,
    expiresAt,
    user: data.user || null,
    raw: data,
  };
};

const handleResult = (data) => {
  if (!data) {
    throw new Error('No response from authentication endpoint');
  }
  return normalizeSession(data);
};

/**
 * Sign up with email and password
 * @param {Object} params - { email, password, name }
 * @returns {Object} normalized session object with token
 */
export const signUpWithEmail = async ({ email, password, data }) => {
  if (warnMissingConfig()) {
    throw new Error('Custom auth client is not configured.');
  }

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  console.log('[CustomAuth] Signing up with email:', email);

  try {
    const response = await fetch(`${normalizeBaseUrl(API_BASE_URL)}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: data?.name || email.split('@')[0],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Sign up failed with status ${response.status}`
      );
    }

    const result = await response.json();
    return handleResult(result);
  } catch (error) {
    console.error('[CustomAuth] Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {Object} params - { email, password }
 * @returns {Object} normalized session object with token
 */
export const signInWithEmail = async ({ email, password }) => {
  if (warnMissingConfig()) {
    throw new Error('Custom auth client is not configured.');
  }

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  console.log('[CustomAuth] Signing in with email:', email);

  try {
    const response = await fetch(`${normalizeBaseUrl(API_BASE_URL)}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Sign in failed with status ${response.status}`
      );
    }

    const result = await response.json();
    return handleResult(result);
  } catch (error) {
    console.error('[CustomAuth] Sign in error:', error);
    throw error;
  }
};

/**
 * Refresh session using refresh token
 * @param {string} refreshToken
 * @returns {Object} normalized session object with new token
 */
export const refreshSession = async (refreshToken) => {
  if (warnMissingConfig()) {
    throw new Error('Custom auth client is not configured.');
  }

  if (!refreshToken) {
    throw new Error('Refresh token is required.');
  }

  console.log('[CustomAuth] Refreshing session');

  try {
    const response = await fetch(`${normalizeBaseUrl(API_BASE_URL)}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Token refresh failed with status ${response.status}`
      );
    }

    const result = await response.json();
    return handleResult(result);
  } catch (error) {
    console.error('[CustomAuth] Refresh error:', error);
    throw error;
  }
};

/**
 * Sign out (invalidate session)
 * @param {string} token - current access token
 */
export const signOut = async (token) => {
  if (warnMissingConfig()) {
    return;
  }

  try {
    await fetch(`${normalizeBaseUrl(API_BASE_URL)}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('[CustomAuth] Sign out error:', error);
  }
};

/**
 * Get current session (for app startup)
 * @param {string} token - current access token
 */
export const getCurrentSession = async (token) => {
  if (warnMissingConfig()) {
    throw new Error('Custom auth client is not configured.');
  }

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${normalizeBaseUrl(API_BASE_URL)}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.user || null;
  } catch (error) {
    console.error('[CustomAuth] Get session error:', error);
    return null;
  }
};

export default {
  signUpWithEmail,
  signInWithEmail,
  refreshSession,
  signOut,
  getCurrentSession,
};
