// src/navigation/AppNavigator.jsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigation';
import MainTabsNavigator from './MainTabsNavigator';
import { colors } from '../theme';

/**
 * Root navigator - decides between Auth flow and Main app
 */
const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {isAuthenticated ? <MainTabsNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
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
