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
    user: null, // { id, email, name, role, shopId, isNewShop? }
  });

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const stored = await secureStorage.getAuth(); // should return { accessToken, user } or null

      if (stored?.accessToken) {
        try {
          const { user } = await authService.getCurrentUser(stored.accessToken);
          setState({
            isLoading: false,
            isAuthenticated: true,
            accessToken: stored.accessToken,
            user,
          });
        } catch (error) {
          console.error('Session validation failed:', error);
          await clearSession();
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveSession = async ({ accessToken, user }) => {
    await secureStorage.saveAuth({ accessToken, user });
    setState({
      isLoading: false,
      isAuthenticated: true,
      accessToken,
      user,
    });
  };

  const clearSession = async () => {
    await secureStorage.clearAuth();
    setState({
      isLoading: false,
      isAuthenticated: false,
      accessToken: null,
      user: null,
    });
  };

  const signUp = async ({ name, email, password }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const { accessToken, user } = await authService.signUp({
        name,
        email,
        password,
      });
      await saveSession({ accessToken, user });
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
      const { accessToken, user } = await authService.login({
        email,
        password,
      });
      await saveSession({ accessToken, user });
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
      if (state.accessToken) {
        await authService.logout(state.accessToken);
      }
    } catch (error) {
      console.error('Server logout error:', error);
    } finally {
      await clearSession();
    }
  };

  const refreshUser = useCallback(async () => {
    if (!state.accessToken) return;
    try {
      const { user } = await authService.getCurrentUser(state.accessToken);
      await secureStorage.saveAuth({
        accessToken: state.accessToken,
        user,
      });
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  }, [state.accessToken]);

  const value = {
    ...state,
    login,
    signUp,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
