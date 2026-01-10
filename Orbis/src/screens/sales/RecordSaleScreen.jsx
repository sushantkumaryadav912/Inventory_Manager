// src/screens/sales/RecordSaleScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Button, DatePicker, Dropdown } from '../../components/ui';
import { inventoryService, salesService } from '../../services/api';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const RecordSaleScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: new Date(),
    paymentMethod: 'CASH',
    notes: '',
  });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lineItem, setLineItem] = useState({
    productId: '',
    quantity: '',
    sellingPrice: '',
  });
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUuid = (value) => {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  };

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventoryResponse = await inventoryService.getItems();
        const invItems = inventoryResponse?.items || [];
        setInventoryItems(Array.isArray(invItems) ? invItems : []);
      } catch (error) {
        console.error('Failed to load inventory:', error);
      }
    };

    loadInventory();
  }, []);

  const productDropdownItems = useMemo(
    () => inventoryItems.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
    [inventoryItems],
  );

  const paymentMethods = useMemo(
    () => [
      { value: 'CASH', label: 'Cash' },
      { value: 'UPI', label: 'UPI' },
      { value: 'CARD', label: 'Card' },
      { value: 'BANK', label: 'Bank Transfer' },
    ],
    [],
  );

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

    const customerId = (formData.customerId || '').trim();
    if (!customerId) {
      newErrors.customerId = 'Customer name is required';
    } else if (customerId.length < 2) {
      newErrors.customerId = 'Customer name must be at least 2 characters';
    }

    if (!items.length) {
      newErrors.items = 'Add at least one item to the sale';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addItem = () => {
    const nextErrors = { ...errors };

    if (!lineItem.productId) {
      nextErrors.productId = 'Select a product';
    }

    const qty = parseInt(lineItem.quantity, 10);
    if (!qty || qty <= 0) {
      nextErrors.quantity = 'Enter a valid quantity';
    }

    const price = parseFloat(lineItem.sellingPrice);
    if (Number.isNaN(price) || price < 0) {
      nextErrors.sellingPrice = 'Enter a valid selling price';
    }

    setErrors(nextErrors);
    if (nextErrors.productId || nextErrors.quantity || nextErrors.sellingPrice) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: lineItem.productId,
        quantity: qty,
        sellingPrice: price,
      },
    ]);

    setLineItem({ productId: '', quantity: '', sellingPrice: '' });
    setErrors((prev) => ({ ...prev, items: undefined, productId: undefined, quantity: undefined, sellingPrice: undefined }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Backend contract (CreateSaleSchema): { customerId?: uuid, paymentMethod, items: [{productId, quantity, sellingPrice}] }
      const customerId = (formData.customerId || '').trim();
      const saleData = {
        ...(customerId ? { customerId } : {}),
        paymentMethod: formData.paymentMethod,
        items,
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
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Record New Sale</Text>

        <View style={styles.form}>
          <DatePicker
            label="Sale Date *"
            value={formData.orderDate}
            onChange={(date) => handleInputChange('orderDate', date)}
            error={errors.orderDate}
          />

          <Dropdown
            label="Payment Method *"
            placeholder="Select payment method"
            value={formData.paymentMethod}
            items={paymentMethods}
            onSelect={(value) => handleInputChange('paymentMethod', value)}
          />

          <Input
            label="Customer Name *"
            placeholder="Enter customer's full name"
            value={formData.customerId}
            onChangeText={(value) => handleInputChange('customerId', value)}
            error={errors.customerId}
            helperText="Full name of the customer making this purchase"
          />

          <Input
            label="Notes"
            placeholder="Add notes (optional)"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={3}
          />

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items *</Text>

            <Dropdown
              label="Product"
              placeholder="Select product"
              value={lineItem.productId}
              items={productDropdownItems}
              onSelect={(value) => setLineItem((prev) => ({ ...prev, productId: value }))}
              error={errors.productId}
            />

            <View style={styles.row}>
              <Input
                label="Quantity *"
                placeholder="Enter qty"
                value={lineItem.quantity}
                onChangeText={(value) => setLineItem((prev) => ({ ...prev, quantity: value }))}
                keyboardType="numeric"
                error={errors.quantity}
                helperText="Number of units"
                style={styles.rowItem}
              />

              <Input
                label="Unit Price *"
                placeholder="Enter price"
                value={lineItem.sellingPrice}
                onChangeText={(value) => setLineItem((prev) => ({ ...prev, sellingPrice: value }))}
                keyboardType="decimal-pad"
                error={errors.sellingPrice}
                helperText="Price per unit"
                style={styles.rowItem}
              />
            </View>

            {!!errors.items && <Text style={styles.inlineError}>{errors.items}</Text>}

            <Button variant="outline" onPress={addItem} fullWidth>
              Add Item
            </Button>

            {items.length > 0 && (
              <View style={styles.itemsSummary}>
                <Text style={styles.itemsSummaryText}>Items added: {items.length}</Text>
              </View>
            )}
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
            onPress={handleSubmit}
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
  itemsSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  inlineError: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: colors.error?.dark || colors.text.primary,
  },
  itemsSummary: {
    marginTop: spacing.md,
  },
  itemsSummaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
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

export default RecordSaleScreen;
