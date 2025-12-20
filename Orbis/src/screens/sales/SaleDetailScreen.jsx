// src/screens/sales/SaleDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenWrapper, Section, LoadingOverlay } from '../../components/layout';
import { Card, Button, Badge } from '../../components/ui';
import { CustomerInfo } from '../../components/domain/sales';
import { usePermissions } from '../../hooks/usePermissions';
import { salesService } from '../../services/api';
import { PERMISSIONS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const SaleDetailScreen = ({ route, navigation }) => {
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
      const response = await salesService.getSaleById(orderId);
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
      'Delete Sale',
      'Are you sure you want to delete this sale order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await salesService.deleteSale(orderId);
              showSuccessAlert('Sale deleted successfully');
              navigation.goBack();
            } catch (error) {
              showErrorAlert(error, 'Failed to delete sale');
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
      <ScrollView style={styles.container}>
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.orderNumber}>SO-{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
            </View>
            <View style={styles.badges}>
              <Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
                {order.status}
              </Badge>
              <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'error'}>
                {order.paymentStatus}
              </Badge>
            </View>
          </View>
        </Card>

        {order.customer && (
          <Section title="Customer">
            <CustomerInfo customer={order.customer} />
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

        <Section title="Payment Summary">
          <Card>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.subtotal || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.tax || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(order.discount || 0)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
          </Card>
        </Section>

        {can(PERMISSIONS.SALES_DELETE) && (
          <View style={styles.actions}>
            <Button
              variant="danger"
              onPress={handleDelete}
              fullWidth
            >
              Delete Sale
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
  badges: {
    gap: spacing.xs,
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
    color: colors.success.main,
  },
  actions: {
    padding: spacing.md,
    marginTop: spacing.lg,
  },
});

export default SaleDetailScreen;
