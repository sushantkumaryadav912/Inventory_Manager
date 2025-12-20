// src/navigation/stacks/SalesStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme';

// Screens
import SalesOrdersListScreen from '../../screens/sales/SalesOrdersListScreen';
import SaleDetailScreen from '../../screens/sales/SaleDetailScreen';
import RecordSaleScreen from '../../screens/sales/RecordSaleScreen';
import CustomersListScreen from '../../screens/sales/CustomersListScreen';

const Stack = createNativeStackNavigator();

const SalesStack = () => {
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
        name="SalesOrdersList"
        component={SalesOrdersListScreen}
        options={{
          title: 'Sales Orders',
        }}
      />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{
          title: 'Sale Details',
        }}
      />
      <Stack.Screen
        name="RecordSale"
        component={RecordSaleScreen}
        options={{
          title: 'Record Sale',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="CustomersList"
        component={CustomersListScreen}
        options={{
          title: 'Customers',
        }}
      />
    </Stack.Navigator>
  );
};

export default SalesStack;
