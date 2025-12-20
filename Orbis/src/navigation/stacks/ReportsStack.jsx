// src/navigation/stacks/ReportsStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme';

// Screens
import OverviewReportScreen from '../../screens/reports/OverviewReportScreen';
import InventoryReportScreen from '../../screens/reports/InventoryReportScreen';
import SalesReportScreen from '../../screens/reports/SalesReportScreen';
import PurchasesReportScreen from '../../screens/reports/PurchasesReportScreen';

const Stack = createNativeStackNavigator();

const ReportsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="OverviewReport"
        component={OverviewReportScreen}
        options={{
          title: 'Reports',
        }}
      />
      <Stack.Screen
        name="InventoryReport"
        component={InventoryReportScreen}
        options={{
          title: 'Inventory Report',
        }}
      />
      <Stack.Screen
        name="SalesReport"
        component={SalesReportScreen}
        options={{
          title: 'Sales Report',
        }}
      />
      <Stack.Screen
        name="PurchasesReport"
        component={PurchasesReportScreen}
        options={{
          title: 'Purchases Report',
        }}
      />
    </Stack.Navigator>
  );
};

export default ReportsStack;
