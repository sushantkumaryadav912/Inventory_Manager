// src/screens/index.js

// Auth Screens
export { default as SplashScreen } from './SplashScreen';
export { default as LoginScreen } from './auth/LoginScreen';
export { default as OnboardingScreen } from './auth/OnboardingScreen';
export { default as ShopSelectionScreen } from './auth/ShopSelectionScreen';

// Inventory Screens
export { default as InventoryListScreen } from './inventory/InventoryListScreen';
export { default as ItemDetailScreen } from './inventory/ItemDetailScreen';
export { default as AdjustStockScreen } from './inventory/AdjustStockScreen';
export { default as CreateItemScreen } from './inventory/CreateItemScreen';
export { default as BulkImportScreen } from './inventory/BulkImportScreen';

// Purchases Screens
export { default as PurchaseOrdersListScreen } from './purchases/PurchaseOrdersListScreen';
export { default as PurchaseOrderDetailScreen } from './purchases/PurchaseOrderDetailScreen';
export { default as CreatePurchaseOrderScreen } from './purchases/CreatePurchaseOrderScreen';
export { default as SuppliersListScreen } from './purchases/SuppliersListScreen';

// Sales Screens
export { default as SalesOrdersListScreen } from './sales/SalesOrdersListScreen';
export { default as SaleDetailScreen } from './sales/SaleDetailScreen';
export { default as RecordSaleScreen } from './sales/RecordSaleScreen';
export { default as CustomersListScreen } from './sales/CustomersListScreen';

// Reports Screens
export { default as OverviewReportScreen } from './reports/OverviewReportScreen';
export { default as InventoryReportScreen } from './reports/InventoryReportScreen';
export { default as SalesReportScreen } from './reports/SalesReportScreen';
export { default as PurchasesReportScreen } from './reports/PurchasesReportScreen';

// Settings Screens
export { default as SettingsHomeScreen } from './settings/SettingsHomeScreen';
export { default as BusinessProfileScreen } from './settings/BusinessProfileScreen';
export { default as ShopSettingsScreen } from './settings/ShopSettingsScreen';
export { default as UsersAndRolesScreen } from './settings/UsersAndRolesScreen';
export { default as AccountSettingsScreen } from './settings/AccountSettingsScreen';
export { default as AboutScreen } from './settings/AboutScreen';
