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
  refreshNeonSession,
  signOutFromNeon,
} from '../services/auth/neonAuthClient';

export const AuthContext = createContext(null);

/**
 * AuthProvider
 *
 * Stores an accessToken (JWT / Neon session token) and user object,
 * coming from your backend which uses Neon Auth under the hood. [web:105]
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
          const refreshed = await refreshNeonSession(workingRefreshToken);
          workingAccessToken = refreshed?.accessToken || workingAccessToken;
          workingRefreshToken = refreshed?.refreshToken || workingRefreshToken;
          workingExpiresAt = refreshed?.expiresAt || null;
        } catch (refreshError) {
          console.error('Failed to refresh Neon session:', refreshError);
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

  const signUp = async ({ name, email, password }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const session = await signUpWithEmail({
        email,
        password,
        data: { name },
      });
      if (!session?.accessToken) {
        throw new Error('Unable to create Neon session.');
      }

      await authService.signUp();
      const { user } = await authService.getCurrentUser();

      await saveSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        user: user || session.user,
      });
      return { success: true, user };
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
      const session = await signInWithEmail({ email, password });
      if (!session?.accessToken) {
        throw new Error('Unable to create Neon session.');
      }

      await authService.login();
      const { user } = await authService.getCurrentUser();

      await saveSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        user: user || session.user,
      });
      return { success: true, user };
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
      await signOutFromNeon();
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
