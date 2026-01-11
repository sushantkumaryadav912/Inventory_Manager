// src/screens/settings/BusinessProfileScreen.jsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper, LoadingOverlay } from '../../components/layout';
import { Input, Button } from '../../components/ui';
import { settingsService } from '../../services/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const BusinessProfileScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBusinessProfile();
    }, [])
  );

  const loadBusinessProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await settingsService.getBusinessProfile();
      setFormData({
        businessName: profile.businessName || '',
        ownerName: profile.ownerName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        gstNumber: profile.gstNumber || '',
      });
    } catch (error) {
      console.error('Failed to load business profile:', error);
      showErrorAlert(error, 'Failed to load business profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await settingsService.updateBusinessProfile(formData);
      showSuccessAlert('Business profile updated successfully');
      navigation.goBack();
    } catch (error) {
      showErrorAlert(error, 'Failed to update business profile');
      console.error('Failed to update profile:', error);
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
        <Text style={styles.title}>Business Profile</Text>

        <View style={styles.form}>
          <Input
            label="Business Name *"
            placeholder="Enter your business name"
            value={formData.businessName}
            onChangeText={(value) => handleInputChange('businessName', value)}
            helperText="Legal name of your business"
          />

          <Input
            label="Owner Name *"
            placeholder="Enter owner's full name"
            value={formData.ownerName}
            onChangeText={(value) => handleInputChange('ownerName', value)}
            helperText="Name of the business owner"
          />

          <Input
            label="Business Email *"
            placeholder="business@example.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            helperText="Primary contact email for business"
          />

          <Input
            label="Phone Number *"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
            helperText="Business contact number"
          />

          <Input
            label="Business Address"
            placeholder="Street address, building number"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={2}
            helperText="Complete business address"
          />

          <Input
            label="City"
            placeholder="Enter city"
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
          />

          <Input
            label="State/Province"
            placeholder="Enter state"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
          />

          <Input
            label="ZIP/Postal Code"
            placeholder="Enter postal code"
            value={formData.pincode}
            onChangeText={(value) => handleInputChange('pincode', value)}
            keyboardType="numeric"
          />

          <Input
            label="GST Number (Optional)"
            placeholder="Enter GST registration number"
            value={formData.gstNumber}
            onChangeText={(value) => handleInputChange('gstNumber', value)}
            autoCapitalize="characters"
            helperText="Tax registration number if applicable"
          />
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  cityField: {
    flex: 2,
  },
  stateField: {
    flex: 1,
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

export default BusinessProfileScreen;
