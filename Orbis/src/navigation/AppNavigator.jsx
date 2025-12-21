// src/navigation/AppNavigator.jsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigation';
import MainTabsNavigator from './MainTabsNavigator';
import { colors } from '../theme';

import ShopSetupScreen from '../screens/auth/ShopSelectionScreen';

/**
 * Root navigator - decides between Auth flow and Main app
 */
const AppNavigator = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (isAuthenticated) {
    if (user?.requiresOnboarding) {
      return <ShopSetupScreen />;
    }
    return <MainTabsNavigator />;
  }

  return <AuthNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default AppNavigator;
