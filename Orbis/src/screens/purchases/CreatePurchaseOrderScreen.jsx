// src/screens/purchases/CreatePurchaseOrderScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Input, Dropdown, Button, DatePicker } from '../../components/ui';
import { inventoryService, purchaseService } from '../../services/api';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const CreatePurchaseOrderScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date(),
    expectedDate: null,
    notes: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lineItem, setLineItem] = useState({
    productId: '',
    quantity: '',
    costPrice: '',
  });
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersResponse, inventoryResponse] = await Promise.all([
          purchaseService.getSuppliers(),
          inventoryService.getItems(),
        ]);

        setSuppliers(Array.isArray(suppliersResponse) ? suppliersResponse : []);

        const invItems = inventoryResponse?.items || [];
        setInventoryItems(Array.isArray(invItems) ? invItems : []);
      } catch (error) {
        // Non-blocking; user can still try again later.
        console.error('Failed to load suppliers/inventory:', error);
      }
    };

    loadData();
  }, []);

  const supplierDropdownItems = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );

  const productDropdownItems = useMemo(
    () => inventoryItems.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })),
    [inventoryItems],
  );

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

    if (!items.length) {
      newErrors.items = 'Add at least one item to the purchase';
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
    const cost = parseFloat(lineItem.costPrice);
    if (Number.isNaN(cost) || cost < 0) {
      nextErrors.costPrice = 'Enter a valid cost price';
    }

    setErrors(nextErrors);
    if (nextErrors.productId || nextErrors.quantity || nextErrors.costPrice) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: lineItem.productId,
        quantity: qty,
        costPrice: cost,
      },
    ]);

    setLineItem({ productId: '', quantity: '', costPrice: '' });
    setErrors((prev) => ({ ...prev, items: undefined, productId: undefined, quantity: undefined, costPrice: undefined }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Backend contract (CreatePurchaseSchema): { supplierId?: uuid, items: [{productId, quantity, costPrice}] }
      const orderData = {
        supplierId: formData.supplierId,
        items,
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
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New Purchase Order</Text>

        <View style={styles.form}>
          <Dropdown
            label="Supplier *"
            placeholder="Choose a supplier for this order"
            value={formData.supplierId}
            items={supplierDropdownItems}
            onSelect={(value) => handleInputChange('supplierId', value)}
            error={errors.supplierId}
            helperText="Select the supplier providing these items"
          />

          <DatePicker
            label="Order Date *"
            value={formData.orderDate}
            onChange={(date) => handleInputChange('orderDate', date)}
            error={errors.orderDate}
            helperText="Date when the order is placed"
          />

          <DatePicker
            label="Expected Delivery Date"
            value={formData.expectedDate}
            onChange={(date) => handleInputChange('expectedDate', date)}
            minimumDate={formData.orderDate}
            helperText="Estimated date of delivery from supplier"
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
              label="Product *"
              placeholder="Choose product to order"
              value={lineItem.productId}
              items={productDropdownItems}
              onSelect={(value) => setLineItem((prev) => ({ ...prev, productId: value }))}
              error={errors.productId}
              helperText="Select item to purchase from supplier"
            />

            <View style={styles.row}>
              <Input
                label="Quantity *"
                placeholder="Enter qty"
                value={lineItem.quantity}
                onChangeText={(value) => setLineItem((prev) => ({ ...prev, quantity: value }))}
                keyboardType="numeric"
                error={errors.quantity}
                style={styles.rowItem}
              />

              <Input
                label="Cost Price"
                placeholder="0.00"
                value={lineItem.costPrice}
                onChangeText={(value) => setLineItem((prev) => ({ ...prev, costPrice: value }))}
                keyboardType="decimal-pad"
                error={errors.costPrice}
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
            Create
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

export default CreatePurchaseOrderScreen;
