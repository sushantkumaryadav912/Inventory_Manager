// src/screens/inventory/CreateItemScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Button } from '../../components/ui';
import { inventoryService } from '../../services/api';
import { isPositiveNumber, isValidQuantity } from '../../utils/validators';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const CreateItemScreen = ({ route, navigation }) => {
  const { itemId, item } = route.params || {};
  const isEditMode = !!itemId;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    quantity: '',
    unit: 'units',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || '',
        description: item.description || '',
        quantity: item.quantity?.toString() || '',
        unit: item.unit || 'units',
        costPrice: item.costPrice?.toString() || '',
        sellingPrice: item.sellingPrice?.toString() || '',
        reorderLevel: item.reorderLevel?.toString() || '',
      });
    }
  }, [isEditMode, item]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.quantity || !isValidQuantity(formData.quantity)) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (!formData.costPrice || !isPositiveNumber(formData.costPrice)) {
      newErrors.costPrice = 'Valid cost price is required';
    }

    if (!formData.sellingPrice || !isPositiveNumber(formData.sellingPrice)) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }

    if (!formData.reorderLevel || !isValidQuantity(formData.reorderLevel)) {
      newErrors.reorderLevel = 'Valid reorder level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const itemData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category.trim() || undefined,
        description: formData.description.trim() || undefined,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        reorderLevel: parseInt(formData.reorderLevel),
      };

      if (isEditMode) {
        await inventoryService.updateItem(itemId, itemData);
        showSuccessAlert('Item updated successfully');
      } else {
        await inventoryService.createItem(itemData);
        showSuccessAlert('Item created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save item:', error);
      showErrorAlert(error, isEditMode ? 'Failed to update item' : 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Item' : 'Add New Item'}
        </Text>

        <View style={styles.form}>
          <Input
            label="Item Name *"
            placeholder="Enter the product name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            error={errors.name}
            helperText="Full name of the product or item"
          />

          <Input
            label="SKU (Stock Keeping Unit) *"
            placeholder="Enter unique SKU code"
            value={formData.sku}
            onChangeText={(value) => handleInputChange('sku', value)}
            error={errors.sku}
            editable={!isEditMode}
            helperText="Unique identifier for inventory tracking"
          />

          <Input
            label="Category"
            placeholder="e.g., Electronics, Clothing, Food"
            value={formData.category}
            onChangeText={(value) => handleInputChange('category', value)}
            error={errors.category}
            helperText="Product category for organization"
          />

          <Input
            label="Description"
            placeholder="Enter detailed product description"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={3}
            helperText="Detailed information about the item"
          />

          <View style={styles.row}>
            <Input
              label="Initial Quantity *"
              placeholder="0"
              value={formData.quantity}
              onChangeText={(value) => handleInputChange('quantity', value)}
              keyboardType="numeric"
              error={errors.quantity}
              helperText="Starting stock"
              style={styles.rowItem}
            />

            <Input
              label="Unit of Measure"
              placeholder="pcs, kg, ltr"
              value={formData.unit}
              onChangeText={(value) => handleInputChange('unit', value)}
              helperText="e.g., pieces, kg"
              style={styles.rowItem}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Cost Price *"
              placeholder="0.00"
              value={formData.costPrice}
              onChangeText={(value) => handleInputChange('costPrice', value)}
              keyboardType="decimal-pad"
              error={errors.costPrice}
              helperText="Purchase cost"
              style={styles.rowItem}
            />

            <Input
              label="Selling Price *"
              placeholder="0.00"
              value={formData.sellingPrice}
              onChangeText={(value) => handleInputChange('sellingPrice', value)}
              keyboardType="decimal-pad"
              error={errors.sellingPrice}
              helperText="Sale price"
              style={styles.rowItem}
            />
          </View>

          <Input
            label="Reorder Level *"
            placeholder="Enter minimum stock level"
            value={formData.reorderLevel}
            onChangeText={(value) => handleInputChange('reorderLevel', value)}
            keyboardType="numeric"
            error={errors.reorderLevel}
            helperText="Alert when stock falls below this quantity"
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
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.actionButton}
          >
            {isEditMode ? 'Update' : 'Create'}
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
  actionButton: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default CreateItemScreen;
