// src/screens/inventory/AdjustStockScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Dropdown, Button } from '../../components/ui';
import { inventoryService } from '../../services/api';
import { ADJUSTMENT_REASONS } from '../../utils/constants';
import { isValidQuantity } from '../../utils/validators';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const AdjustStockScreen = ({ route, navigation }) => {
  const { itemId, itemName } = route.params;
  const [formData, setFormData] = useState({
    delta: '',
    reason: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonOptions = Object.entries(ADJUSTMENT_REASONS).map(([key, value]) => ({
    label: value,
    value: key,
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.delta || formData.delta === '0') {
      newErrors.delta = 'Please enter a quantity';
    } else if (!isValidQuantity(Math.abs(parseFloat(formData.delta)))) {
      newErrors.delta = 'Please enter a valid quantity';
    }

    if (!formData.reason) {
      newErrors.reason = 'Please select a reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const adjustmentData = {
        itemId,
        delta: parseFloat(formData.delta),
        reason: ADJUSTMENT_REASONS[formData.reason],
        notes: formData.notes || undefined,
      };

      await inventoryService.adjustStock(adjustmentData);
      
      showSuccessAlert('Stock adjusted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      showErrorAlert(error, 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Adjust Stock</Text>
        <Text style={styles.itemName}>{itemName}</Text>

        <View style={styles.form}>
          <Input
            label="Quantity Change"
            placeholder="Enter quantity (use - for decrease)"
            value={formData.delta}
            onChangeText={(value) => handleInputChange('delta', value)}
            keyboardType="numeric"
            error={errors.delta}
            helperText="Example: +10 to add, -5 to remove"
          />

          <Dropdown
            label="Reason"
            placeholder="Select reason"
            value={formData.reason}
            items={reasonOptions}
            onSelect={(value) => handleInputChange('reason', value)}
            error={errors.reason}
          />

          <Input
            label="Notes (Optional)"
            placeholder="Add additional notes"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={3}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Stock adjustments are logged and cannot be undone. Make sure the quantity is correct before submitting.
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
            Adjust Stock
          </Button>
        </View>
      </View>
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
    marginBottom: spacing.xs,
  },
  itemName: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
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
    paddingTop: spacing.lg,
  },
});

export default AdjustStockScreen;
