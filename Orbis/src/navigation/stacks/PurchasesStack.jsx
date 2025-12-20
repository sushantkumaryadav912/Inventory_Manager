// src/navigation/stacks/PurchasesStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme';

// Screens
import PurchaseOrdersListScreen from '../../screens/purchases/PurchaseOrdersListScreen';
import PurchaseOrderDetailScreen from '../../screens/purchases/PurchaseOrderDetailScreen';
import CreatePurchaseOrderScreen from '../../screens/purchases/CreatePurchaseOrderScreen';
import SuppliersListScreen from '../../screens/purchases/SuppliersListScreen';

const Stack = createNativeStackNavigator();

const PurchasesStack = () => {
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
        name="PurchaseOrdersList"
        component={PurchaseOrdersListScreen}
        options={{
          title: 'Purchase Orders',
        }}
      />
      <Stack.Screen
        name="PurchaseOrderDetail"
        component={PurchaseOrderDetailScreen}
        options={{
          title: 'Order Details',
        }}
      />
      <Stack.Screen
        name="CreatePurchaseOrder"
        component={CreatePurchaseOrderScreen}
        options={{
          title: 'New Purchase Order',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="SuppliersList"
        component={SuppliersListScreen}
        options={{
          title: 'Suppliers',
        }}
      />
    </Stack.Navigator>
  );
};

export default PurchasesStack;
