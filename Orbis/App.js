// App.js
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TenantProvider } from './src/context/TenantContext';
import { PermissionsProvider } from './src/context/PermissionsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TenantProvider>
          <PermissionsProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </PermissionsProvider>
        </TenantProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
