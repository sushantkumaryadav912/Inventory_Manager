// src/navigation/stacks/SettingsStack.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../theme';

// Screens
import SettingsHomeScreen from '../../screens/settings/SettingsHomeScreen';
import BusinessProfileScreen from '../../screens/settings/BusinessProfileScreen';
import ShopSettingsScreen from '../../screens/settings/ShopSettingsScreen';
import UsersAndRolesScreen from '../../screens/settings/UsersAndRolesScreen';
import AccountSettingsScreen from '../../screens/settings/AccountSettingsScreen';
import AboutScreen from '../../screens/settings/AboutScreen';

const Stack = createNativeStackNavigator();

const SettingsStack = () => {
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
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="BusinessProfile"
        component={BusinessProfileScreen}
        options={{
          title: 'Business Profile',
        }}
      />
      <Stack.Screen
        name="ShopSettings"
        component={ShopSettingsScreen}
        options={{
          title: 'Shop Settings',
        }}
      />
      <Stack.Screen
        name="UsersAndRoles"
        component={UsersAndRolesScreen}
        options={{
          title: 'Users & Roles',
        }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{
          title: 'Account',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About Orbis',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStack;
