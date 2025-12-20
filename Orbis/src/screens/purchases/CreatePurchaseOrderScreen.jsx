// src/screens/purchases/CreatePurchaseOrderScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Dropdown, Button, DatePicker } from '../../components/ui';
import { purchaseService } from '../../services/api';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const CreatePurchaseOrderScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date(),
    expectedDate: null,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock suppliers - replace with actual API call
  const suppliers = [
    { value: '1', label: 'Supplier A' },
    { value: '2', label: 'Supplier B' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier';
    }

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

      const orderData = {
        supplierId: formData.supplierId,
        orderDate: formData.orderDate,
        expectedDate: formData.expectedDate,
        notes: formData.notes || undefined,
        items: [], // TODO: Add items selection
      };

      await purchaseService.createPurchaseOrder(orderData);
      showSuccessAlert('Purchase order created successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create order:', error);
      showErrorAlert(error, 'Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>New Purchase Order</Text>

        <View style={styles.form}>
          <Dropdown
            label="Supplier *"
            placeholder="Select supplier"
            value={formData.supplierId}
            items={suppliers}
            onSelect={(value) => handleInputChange('supplierId', value)}
            error={errors.supplierId}
          />

          <DatePicker
            label="Order Date *"
            value={formData.orderDate}
            onChange={(date) => handleInputChange('orderDate', date)}
            error={errors.orderDate}
          />

          <DatePicker
            label="Expected Delivery Date"
            value={formData.expectedDate}
            onChange={(date) => handleInputChange('expectedDate', date)}
            minimumDate={formData.orderDate}
          />

          <Input
            label="Notes"
            placeholder="Add notes (optional)"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={3}
          />

          {/* TODO: Add items selection component */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Item selection will be available in the next step
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
            Create Order
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

export default CreatePurchaseOrderScreen;
