// src/screens/settings/BusinessProfileScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Button } from '../../components/ui';
import { showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const BusinessProfileScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    businessName: 'My Business',
    ownerName: 'John Doe',
    email: 'john@business.com',
    phone: '+91 98765 43210',
    address: '123 Business Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      // TODO: Call API to update business profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccessAlert('Business profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Business Profile</Text>

        <View style={styles.form}>
          <Input
            label="Business Name *"
            value={formData.businessName}
            onChangeText={(value) => handleInputChange('businessName', value)}
          />

          <Input
            label="Owner Name *"
            value={formData.ownerName}
            onChangeText={(value) => handleInputChange('ownerName', value)}
          />

          <Input
            label="Email *"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone *"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />

          <Input
            label="Address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={2}
          />

          <View style={styles.row}>
            <Input
              label="City"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              style={styles.rowItem}
            />

            <Input
              label="State"
              value={formData.state}
              onChangeText={(value) => handleInputChange('state', value)}
              style={styles.rowItem}
            />
          </View>

          <Input
            label="PIN Code"
            value={formData.pincode}
            onChangeText={(value) => handleInputChange('pincode', value)}
            keyboardType="numeric"
          />

          <Input
            label="GST Number"
            value={formData.gstNumber}
            onChangeText={(value) => handleInputChange('gstNumber', value)}
            autoCapitalize="characters"
          />
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
});

export default BusinessProfileScreen;
