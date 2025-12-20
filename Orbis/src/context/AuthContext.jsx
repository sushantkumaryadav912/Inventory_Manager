// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import secureStorage from '../services/storage/secureStorage';
import { authService } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isLoading: true,
    isAuthenticated: false,
    neonToken: null,
    userId: null,
    shopId: null,
    role: null,
    isNewShop: false,
  });

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  /**
   * Load authentication data from secure storage
   */
  const loadStoredAuth = async () => {
    try {
      console.log('Loading stored auth...');
      const authData = await secureStorage.getAuth();
      
      if (authData && authData.neonToken) {
        // Validate token with backend by re-calling onboard
        // (This is idempotent - won't create duplicate data)
        try {
          const response = await authService.validateSession(authData.neonToken);
          
          if (response.success) {
            const updatedAuth = {
              neonToken: authData.neonToken,
              userId: response.userId,
              shopId: response.shopId,
              role: response.role,
            };
            
            // Update storage with fresh data
            await secureStorage.saveAuth(updatedAuth);
            
            setState({
              isLoading: false,
              isAuthenticated: true,
              ...updatedAuth,
            });
            
            console.log('Auth restored successfully');
          } else {
            throw new Error('Session validation failed');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token expired or invalid, clear auth
          await logout();
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Login with Neon token
   * In a real implementation, you'd integrate Neon SDK here
   */
  const login = async (neonToken) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Call backend to onboard user
      const response = await authService.onboard(neonToken);
      
      if (!response.success) {
        throw new Error('Onboarding failed');
      }

      const authData = {
        neonToken,
        userId: response.userId,
        shopId: response.shopId,
        role: response.role,
      };

      // Save to secure storage
      await secureStorage.saveAuth(authData);

      setState({
        isLoading: false,
        isAuthenticated: true,
        ...authData,
        isNewShop: response.isNewShop,
      });

      console.log('Login successful:', {
        userId: response.userId,
        shopId: response.shopId,
        role: response.role,
        isNewShop: response.isNewShop,
      });

      return { 
        success: true, 
        isNewShop: response.isNewShop 
      };
    } catch (error) {
      console.error('Login failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      Alert.alert(
        'Login Failed',
        error.message || 'Unable to login. Please try again.'
      );
      
      throw error;
    }
  };

  /**
   * Logout - clear all auth data
   */
  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Clear secure storage
      await secureStorage.clearAuth();
      
      // Reset state
      setState({
        isLoading: false,
        isAuthenticated: false,
        neonToken: null,
        userId: null,
        shopId: null,
        role: null,
        isNewShop: false,
      });
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Refresh auth state from backend
   * Useful after role changes or shop updates
   */
  const refreshAuth = useCallback(async () => {
    if (!state.neonToken) {
      console.warn('Cannot refresh: no token available');
      return;
    }

    try {
      console.log('Refreshing auth state...');
      const response = await authService.validateSession(state.neonToken);
      
      if (response.success) {
        const authData = {
          neonToken: state.neonToken,
          userId: response.userId,
          shopId: response.shopId,
          role: response.role,
        };
        
        await secureStorage.saveAuth(authData);
        setState(prev => ({ 
          ...prev, 
          ...authData 
        }));
        
        console.log('Auth refreshed successfully');
      }
    } catch (error) {
      console.error('Refresh auth failed:', error);
      // If refresh fails, force logout
      await logout();
    }
  }, [state.neonToken]);

  /**
   * Update token (for Neon SDK token refresh)
   */
  const updateToken = async (newToken) => {
    try {
      const authData = {
        ...state,
        neonToken: newToken,
      };
      
      await secureStorage.saveAuth(authData);
      setState(prev => ({ ...prev, neonToken: newToken }));
      
      console.log('Token updated successfully');
    } catch (error) {
      console.error('Failed to update token:', error);
    }
  };

  const value = {
    // State
    ...state,
    
    // Methods
    login,
    logout,
    refreshAuth,
    updateToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
