// src/screens/auth/ShopSelectionScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import apiClient from '../../services/api/apiClient';
import { useAuth } from '../../hooks/useAuth';

const ShopSetupScreen = () => {
  const { refreshUser } = useAuth();
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Please enter a shop name');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/onboard', {
        shopName: shopName.trim(),
        businessType: businessType.trim(),
      });
      
      // Refresh user to update local state (clear requiresOnboarding, update shopName)
      await refreshUser();
    } catch (error) {
      console.error('Shop setup error:', error);
      Alert.alert('Error', 'Failed to set up shop. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🏪</Text>
          <Text style={styles.title}>Setup your Shop</Text>
          <Text style={styles.subtitle}>
            Give your business a home. You can change these details later.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Shop Name"
            placeholder="e.g. Super Mart"
            value={shopName}
            onChangeText={setShopName}
          />
          <Input
            label="Business Type (Optional)"
            placeholder="e.g. Grocery, electronic, etc"
            value={businessType}
            onChangeText={setBusinessType}
          />
        </View>

        <Button
          onPress={handleSetup}
          loading={isLoading}
          fullWidth
          size="lg"
        >
          Complete Setup
        </Button>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
});

export default ShopSetupScreen;
