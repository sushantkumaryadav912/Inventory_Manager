// src/context/TenantContext.jsx
import React, { createContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

export const TenantContext = createContext(null);

/**
 * TenantContext - manages shop/tenant state
 * Currently simplified for single-shop model
 * Can be extended for multi-shop support later
 */
export const TenantProvider = ({ children }) => {
  const { shopId, isAuthenticated } = useAuth();

  /**
   * Current shop info (minimal for now)
   * In multi-shop scenario, this would fetch shop details
   */
  const currentShop = useMemo(() => {
    if (!isAuthenticated || !shopId) return null;
    
    return {
      id: shopId,
      // Additional shop details can be fetched from backend
      // For now, we only have the ID from auth context
    };
  }, [shopId, isAuthenticated]);

  /**
   * Get current shop ID
   */
  const getShopId = () => {
    return shopId;
  };

  /**
   * Check if shop is active
   */
  const hasActiveShop = () => {
    return !!shopId;
  };

  /**
   * Switch shop (placeholder for future multi-shop support)
   */
  const switchShop = async (newShopId) => {
    console.warn('Multi-shop support not yet implemented');
    // Future: call backend to switch shop, update auth context
  };

  const value = {
    currentShop,
    shopId,
    getShopId,
    hasActiveShop,
    switchShop,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
