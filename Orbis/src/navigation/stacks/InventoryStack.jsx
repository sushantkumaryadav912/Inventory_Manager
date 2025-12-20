// src/navigation/stacks/InventoryStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme';

// Screens
import InventoryListScreen from '../../screens/inventory/InventoryListScreen';
import ItemDetailScreen from '../../screens/inventory/ItemDetailScreen';
import AdjustStockScreen from '../../screens/inventory/AdjustStockScreen';
import CreateItemScreen from '../../screens/inventory/CreateItemScreen';
import BulkImportScreen from '../../screens/inventory/BulkImportScreen';

const Stack = createNativeStackNavigator();

const InventoryStack = () => {
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
        name="InventoryList"
        component={InventoryListScreen}
        options={{
          title: 'Inventory',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{
          title: 'Item Details',
        }}
      />
      <Stack.Screen
        name="AdjustStock"
        component={AdjustStockScreen}
        options={{
          title: 'Adjust Stock',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="CreateItem"
        component={CreateItemScreen}
        options={{
          title: 'Add Item',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="BulkImport"
        component={BulkImportScreen}
        options={{
          title: 'Bulk Import',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default InventoryStack;
