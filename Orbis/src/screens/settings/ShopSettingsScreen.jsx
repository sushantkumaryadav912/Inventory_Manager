// src/screens/settings/ShopSettingsScreen.jsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper, LoadingOverlay } from '../../components/layout';
import { Input, Dropdown, Button } from '../../components/ui';
import { settingsService } from '../../services/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const ShopSettingsScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    shopName: '',
    currency: 'INR',
    taxRate: '',
    lowStockThreshold: '',
    enableNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadShopSettings();
    }, [])
  );

  const loadShopSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsService.getShopSettings();

      const resolvedTaxRate =
        settings.taxRate ?? settings.defaultTaxRate ?? 18;
      const resolvedLowStockThreshold =
        settings.lowStockThreshold ?? settings.reorderLevel ?? 10;

      setFormData({
        shopName: settings.shopName || settings.name || '',
        currency: settings.currency || 'INR',
        taxRate: String(resolvedTaxRate),
        lowStockThreshold: String(resolvedLowStockThreshold),
        enableNotifications: settings.enableNotifications !== false,
      });
    } catch (error) {
      console.error('Failed to load shop settings:', error);
      showErrorAlert(error, 'Failed to load shop settings');
    } finally {
      setIsLoading(false);
    }
  };

  const currencyOptions = [
    { value: 'INR', label: '₹ Indian Rupee (INR)' },
    { value: 'USD', label: '$ US Dollar (USD)' },
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'GBP', label: '£ British Pound (GBP)' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await settingsService.updateShopSettings({
        shopName: formData.shopName,
        currency: formData.currency,
        taxRate: parseFloat(formData.taxRate),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        enableNotifications: formData.enableNotifications,
      });
      showSuccessAlert('Shop settings updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update settings:', error);
      showErrorAlert(error, 'Failed to update shop settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Shop Settings</Text>

        <View style={styles.form}>
          <Input
            label="Shop Name *"
            placeholder="Enter your shop name"
            value={formData.shopName}
            onChangeText={(value) => handleInputChange('shopName', value)}
            helperText="Display name for your shop"
          />

          <Dropdown
            label="Currency *"
            value={formData.currency}
            items={currencyOptions}
            onSelect={(value) => handleInputChange('currency', value)}
            placeholder="Select your default currency"
            helperText="Primary currency for all transactions"
          />

          <Input
            label="Default Tax Rate (%)"
            value={formData.taxRate}
            onChangeText={(value) => handleInputChange('taxRate', value)}
            keyboardType="decimal-pad"
            placeholder="18"
            helperText="Default tax rate for products"
          />

          <Input
            label="Low Stock Threshold"
            value={formData.lowStockThreshold}
            onChangeText={(value) => handleInputChange('lowStockThreshold', value)}
            keyboardType="numeric"
            placeholder="10"
            helperText="Get notified when stock falls below this level"
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 These settings will apply to all inventory items by default. You can override them for individual items.
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSave}
            loading={isSubmitting}
            style={styles.actionButton}
          >
            Save
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  form: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: colors.info.light,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.info.dark,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default ShopSettingsScreen;
