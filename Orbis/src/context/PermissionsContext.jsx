// src/context/PermissionsContext.jsx
import React, { createContext, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLES, PERMISSIONS } from '../utils/constants';

export const PermissionsContext = createContext(null);

// Define what each role can do
const ROLE_PERMISSIONS_MAP = {
  [ROLES.OWNER]: [
    // Inventory
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_DELETE,
    
    // Purchases
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.PURCHASES_APPROVE,
    PERMISSIONS.PURCHASES_DELETE,
    
    // Sales
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_DELETE,
    
    // Contacts
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.CONTACTS_MANAGE,
    
    // Reports
    PERMISSIONS.REPORTS_READ,
    
    // Settings
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.USERS_MANAGE,
  ],
  
  [ROLES.MANAGER]: [
    // Inventory
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_DELETE,
    
    // Purchases
    PERMISSIONS.PURCHASES_READ,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.PURCHASES_APPROVE,
    PERMISSIONS.PURCHASES_DELETE,
    
    // Sales
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_DELETE,
    
    // Contacts
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.CONTACTS_MANAGE,
    
    // Reports
    PERMISSIONS.REPORTS_READ,
    
    // Limited settings (no user management)
    // PERMISSIONS.SETTINGS_MANAGE, // Excluded
    // PERMISSIONS.USERS_MANAGE, // Excluded
  ],
  
  [ROLES.STAFF]: [
    // Inventory (read only, no adjustments)
    PERMISSIONS.INVENTORY_READ,
    // PERMISSIONS.INVENTORY_ADJUST, // Excluded
    // PERMISSIONS.INVENTORY_CREATE, // Excluded
    
    // Sales
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_CREATE,
    
    // Contacts (read only)
    PERMISSIONS.CONTACTS_READ,
    // PERMISSIONS.CONTACTS_MANAGE, // Excluded
    
    // No purchases, reports, or settings access
  ],
};

export const PermissionsProvider = ({ children }) => {
  const { role, isAuthenticated } = useAuth();

  /**
   * Get all permissions for current role
   */
  const permissions = useMemo(() => {
    if (!isAuthenticated || !role) return [];
    return ROLE_PERMISSIONS_MAP[role] || [];
  }, [role, isAuthenticated]);

  /**
   * Check if user has a specific permission
   */
  const can = useCallback((permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  /**
   * Check if user has ANY of the given permissions
   */
  const canAny = useCallback((...permissionList) => {
    return permissionList.some(p => permissions.includes(p));
  }, [permissions]);

  /**
   * Check if user has ALL of the given permissions
   */
  const canAll = useCallback((...permissionList) => {
    return permissionList.every(p => permissions.includes(p));
  }, [permissions]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((checkRole) => {
    return role === checkRole;
  }, [role]);

  /**
   * Check if user has ANY of the given roles
   */
  const hasAnyRole = useCallback((...roles) => {
    return roles.includes(role);
  }, [role]);

  const value = {
    permissions,
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    role,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
