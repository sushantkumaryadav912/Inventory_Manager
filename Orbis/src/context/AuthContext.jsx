// src/context/AuthContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Alert } from 'react-native';
import secureStorage from '../services/storage/secureStorage';
import { authService } from '../services/api';
import {
  signUpWithEmail,
  signInWithEmail,
  refreshSession,
  signOut,
  getCurrentSession,
} from '../services/auth/customAuthClient';

export const AuthContext = createContext(null);

/**
 * AuthProvider
 *
 * Stores an accessToken (JWT) and user object from custom auth backend.
 */
export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoading: true,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null, // { id, email, name, role, shopId, isNewShop? }
  });

  useEffect(() => {
    loadStoredSession();
  }, []);

  const isTokenExpired = (expiresAt) => {
    if (!expiresAt) return false;
    const now = Date.now();
    return expiresAt * 1000 <= now + 5000; // include small buffer
  };

  const saveSession = async ({ accessToken, refreshToken = null, expiresAt = null, user }) => {
    await secureStorage.saveAuth({ accessToken, refreshToken, expiresAt, user });
    setState({
      isLoading: false,
      isAuthenticated: true,
      accessToken,
      refreshToken,
      expiresAt,
      user,
    });
  };

  const loadStoredSession = async () => {
    try {
      const stored = await secureStorage.getAuth();

      if (!stored?.accessToken) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      let workingAccessToken = stored.accessToken;
      let workingRefreshToken = stored.refreshToken || null;
      let workingExpiresAt = stored.expiresAt || null;

      if (isTokenExpired(workingExpiresAt) && workingRefreshToken) {
        try {
          const refreshed = await refreshSession(workingRefreshToken);
          workingAccessToken = refreshed?.accessToken || workingAccessToken;
          workingRefreshToken = refreshed?.refreshToken || workingRefreshToken;
          workingExpiresAt = refreshed?.expiresAt || null;
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          Alert.alert('Session expired', 'Please sign in again.');
          await clearSession();
          return;
        }
      } else if (isTokenExpired(workingExpiresAt)) {
        Alert.alert('Session expired', 'Please sign in again.');
        await clearSession();
        return;
      }

      try {
        // DEV BYPASS: If using dev token, skip backend validation
        if (workingAccessToken === 'dev-token') {
          console.log('Restoring dev session');
          await saveSession({
            accessToken: workingAccessToken,
            refreshToken: workingRefreshToken,
            expiresAt: workingExpiresAt,
            user: stored.user,
          });
          return;
        }

        const { user } = await authService.getCurrentUser();
        await saveSession({
          accessToken: workingAccessToken,
          refreshToken: workingRefreshToken,
          expiresAt: workingExpiresAt,
          user: user || stored.user,
        });
      } catch (error) {
        console.error('Session validation failed:', error);
        await clearSession();
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const clearSession = async () => {
    await secureStorage.clearAuth();
    setState({
      isLoading: false,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
    });
  };

  const updateUser = async (patch) => {
    setState((prev) => {
      const nextUser = { ...(prev.user || {}), ...(patch || {}) };
      return { ...prev, user: nextUser };
    });

    const stored = await secureStorage.getAuth();
    if (stored?.accessToken) {
      await secureStorage.saveAuth({
        ...stored,
        user: { ...(stored.user || {}), ...(patch || {}) },
      });
    }
  };

  const signUp = async ({ name, email, password }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const session = await signUpWithEmail({
        email,
        password,
        data: { name },
      });
      if (!session?.accessToken) {
        throw new Error('Unable to create session. Auth service might be misconfigured or returned no token.');
      }

      const normalizedUser = {
        ...(session.user || {}),
        requiresOnboarding: Boolean(session.raw?.requiresOnboarding),
        requiresEmailVerification: Boolean(session.raw?.requiresEmailVerification),
        emailVerified: Boolean(session.raw?.emailVerified),
      };

      await saveSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        user: normalizedUser,
      });
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Sign up failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to sign up. Please try again.';
      Alert.alert('Sign Up Failed', message);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const login = async ({ email, password }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // DEV BYPASS
      if (email === 'dev@aerosy.in' && password === 'dev') {
        console.log('Using Dev Bypass');
        const devUser = {
          id: 'dev-user',
          email: 'dev@aerosy.in',
          name: 'Dev User',
          role: 'OWNER',
          shopId: 'dev-shop-id',
        };
        // Mock session
        await saveSession({
          accessToken: 'dev-token',
          refreshToken: 'dev-refresh-token',
          expiresAt: Math.floor(Date.now() / 1000) + 3600 * 24, // 1 day
          user: devUser,
        });
        return { success: true, user: devUser };
      }

      const session = await signInWithEmail({ email, password });
      if (!session?.accessToken) {
        console.log('Session created but no access token?', session);
        throw new Error('Unable to create session. Please check your internet connection or credentials.');
      }

      const normalizedUser = {
        ...(session.user || {}),
        requiresOnboarding: Boolean(session.raw?.requiresOnboarding),
        requiresEmailVerification: Boolean(session.raw?.requiresEmailVerification),
        emailVerified: Boolean(session.raw?.emailVerified),
      };

      await saveSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        user: normalizedUser,
      });
      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('Login failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to login. Please check your credentials.';
      Alert.alert('Login Failed', message);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await signOut(state.accessToken);
    } catch (error) {
      console.error('Server logout error:', error);
    } finally {
      await clearSession();
    }
  };

  const refreshUser = useCallback(async () => {
    if (!state.accessToken) return;
    try {
      const { user } = await authService.getCurrentUser();
      await secureStorage.saveAuth({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user,
      });
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  }, [state.accessToken, state.refreshToken, state.expiresAt]);

  const value = {
    ...state,
    login,
    signUp,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
