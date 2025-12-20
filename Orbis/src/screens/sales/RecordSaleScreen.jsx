// src/screens/sales/RecordSaleScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Button, DatePicker } from '../../components/ui';
import { salesService } from '../../services/api';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const RecordSaleScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: new Date(),
    paymentStatus: 'paid',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const saleData = {
        customerId: formData.customerId || undefined,
        orderDate: formData.orderDate,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes || undefined,
        items: [], // TODO: Add items selection
      };

      await salesService.createSale(saleData);
      showSuccessAlert('Sale recorded successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to record sale:', error);
      showErrorAlert(error, 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Record New Sale</Text>

        <View style={styles.form}>
          <DatePicker
            label="Sale Date *"
            value={formData.orderDate}
            onChange={(date) => handleInputChange('orderDate', date)}
            error={errors.orderDate}
          />

          <Input
            label="Customer (Optional)"
            placeholder="Select or add customer"
            value={formData.customerId}
            onChangeText={(value) => handleInputChange('customerId', value)}
          />

          <Input
            label="Notes"
            placeholder="Add notes (optional)"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={3}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Item selection and payment details will be available in the next step
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
            onPress={handleSubmit}
            loading={isSubmitting}
            fullWidth
          >
            Record Sale
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
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
});

export default RecordSaleScreen;
