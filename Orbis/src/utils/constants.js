// src/utils/constants.js
export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
};

export const PERMISSIONS = {
  // Inventory
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_DELETE: 'inventory.delete',

  // Purchases
  PURCHASES_READ: 'purchases.read',
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_APPROVE: 'purchases.approve',
  PURCHASES_DELETE: 'purchases.delete',

  // Sales
  SALES_READ: 'sales.read',
  SALES_CREATE: 'sales.create',
  SALES_DELETE: 'sales.delete',

  // Contacts
  CONTACTS_READ: 'contacts.read',
  CONTACTS_MANAGE: 'contacts.manage',

  // Reports
  REPORTS_READ: 'reports.read',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',
  USERS_MANAGE: 'users.manage',
};

export const STOCK_LEVELS = {
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  IN_STOCK: 'IN_STOCK',
  OVERSTOCKED: 'OVERSTOCKED',
};

export const ADJUSTMENT_REASONS = {
  DAMAGE: 'Damage/Loss',
  CORRECTION: 'Inventory Correction',
  RETURN: 'Customer Return',
  THEFT: 'Theft',
  EXPIRED: 'Expired',
  OTHER: 'Other',
};

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH: 'orbis_auth',
  THEME: 'orbis_theme',
  ONBOARDING: 'orbis_onboarding_complete',
};
