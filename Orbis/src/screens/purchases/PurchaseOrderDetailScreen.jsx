// src/screens/purchases/PurchaseOrderDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenWrapper, Section, LoadingOverlay } from '../../components/layout';
import { Card, Button, Badge } from '../../components/ui';
import { SupplierInfo } from '../../components/domain/purchases';
import { usePermissions } from '../../hooks/usePermissions';
import { purchaseService } from '../../services/api';
import { PERMISSIONS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const PurchaseOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { can } = usePermissions();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await purchaseService.getPurchaseOrderById(orderId);
      setOrder(response.order || response);
    } catch (error) {
      console.error('Failed to load order:', error);
      showErrorAlert(error, 'Failed to load order details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this purchase order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await purchaseService.deletePurchaseOrder(orderId);
              showSuccessAlert('Order deleted successfully');
              navigation.goBack();
            } catch (error) {
              showErrorAlert(error, 'Failed to delete order');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !order) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.orderNumber}>PO-{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
            </View>
            <Badge variant={order.status === 'received' ? 'success' : 'warning'}>
              {order.status}
            </Badge>
          </View>
        </Card>

        {order.supplier && (
          <Section title="Supplier">
            <SupplierInfo supplier={order.supplier} />
          </Section>
        )}

        <Section title="Order Items">
          <Card>
            {order.items?.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatCurrency(item.quantity * item.price)}
                </Text>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Order Summary">
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.subtotal || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.tax || 0)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
          </Card>
        </Section>

        {can(PERMISSIONS.PURCHASES_DELETE) && (
          <View style={styles.actions}>
            <Button
              variant="danger"
              onPress={handleDelete}
              fullWidth
            >
              Delete Order
            </Button>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  itemTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.main,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  actions: {
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default PurchaseOrderDetailScreen;