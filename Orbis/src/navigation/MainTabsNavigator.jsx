// src/navigation/MainTabsNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../utils/constants';
import { colors, typography } from '../theme';

// Stack navigators
import InventoryStack from './stacks/InventoryStack';
import PurchasesStack from './stacks/PurchasesStack';
import SalesStack from './stacks/SalesStack';
import ReportsStack from './stacks/ReportsStack';
import SettingsStack from './stacks/SettingsStack';

const Tab = createBottomTabNavigator();

/**
 * Main bottom tab navigator with role-based tab visibility
 */
const MainTabsNavigator = () => {
  const { can } = usePermissions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          height: 60,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          backgroundColor: colors.background.primary,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'InventoryTab':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'PurchasesTab':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'SalesTab':
              iconName = focused ? 'cash' : 'cash-outline';
              break;
            case 'ReportsTab':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'SettingsTab':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      {/* Inventory - All roles */}
      {can(PERMISSIONS.INVENTORY_READ) && (
        <Tab.Screen
          name="InventoryTab"
          component={InventoryStack}
          options={{
            title: 'Inventory',
            tabBarLabel: 'Inventory',
          }}
        />
      )}

      {/* Purchases - OWNER + MANAGER only */}
      {can(PERMISSIONS.PURCHASES_READ) && (
        <Tab.Screen
          name="PurchasesTab"
          component={PurchasesStack}
          options={{
            title: 'Purchases',
            tabBarLabel: 'Purchases',
          }}
        />
      )}

      {/* Sales - All roles */}
      {can(PERMISSIONS.SALES_READ) && (
        <Tab.Screen
          name="SalesTab"
          component={SalesStack}
          options={{
            title: 'Sales',
            tabBarLabel: 'Sales',
          }}
        />
      )}

      {/* Reports - OWNER + MANAGER only */}
      {can(PERMISSIONS.REPORTS_READ) && (
        <Tab.Screen
          name="ReportsTab"
          component={ReportsStack}
          options={{
            title: 'Reports',
            tabBarLabel: 'Reports',
          }}
        />
      )}

      {/* Settings - OWNER only (or MANAGER with limited access) */}
      {can(PERMISSIONS.SETTINGS_MANAGE) && (
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStack}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
      )}
    </Tab.Navigator>
  );
};

export default MainTabsNavigator;
