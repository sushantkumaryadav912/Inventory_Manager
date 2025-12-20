// src/screens/settings/ShopSettingsScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Dropdown, Button } from '../../components/ui';
import { showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const ShopSettingsScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    shopName: 'Main Shop',
    currency: 'INR',
    taxRate: '18',
    lowStockThreshold: '10',
    enableNotifications: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // TODO: Call API to update shop settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccessAlert('Shop settings updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Shop Settings</Text>

        <View style={styles.form}>
          <Input
            label="Shop Name *"
            value={formData.shopName}
            onChangeText={(value) => handleInputChange('shopName', value)}
            placeholder="Enter shop name"
          />

          <Dropdown
            label="Currency *"
            value={formData.currency}
            items={currencyOptions}
            onSelect={(value) => handleInputChange('currency', value)}
            placeholder="Select currency"
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
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onPress={handleSave}
            loading={isSubmitting}
            fullWidth
          >
            Save Changes
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
});

export default ShopSettingsScreen;
