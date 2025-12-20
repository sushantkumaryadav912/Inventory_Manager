// src/components/domain/sales/SalesOrderCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Badge } from '../../ui';

const SalesOrderCard = ({ order, onPress, style }) => {
  const {
    orderNumber,
    customer,
    orderDate,
    status,
    totalAmount,
    itemsCount,
    paymentStatus,
  } = order;

  const getStatusVariant = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentVariant = () => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'partial':
        return 'info';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>SO-{orderNumber}</Text>
          <Text style={styles.customer}>{customer?.name || 'Walk-in Customer'}</Text>
        </View>
        <View style={styles.badges}>
          <Badge variant={getStatusVariant()} size="sm">
            {status || 'Pending'}
          </Badge>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <View style={styles.infoText}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatDate(orderDate)}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons 
              name={paymentStatus === 'paid' ? 'checkmark-circle' : 'time-outline'} 
              size={16} 
              color={paymentStatus === 'paid' ? colors.success.main : colors.text.secondary} 
            />
            <View style={styles.infoText}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.value}>{paymentStatus || 'Pending'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.itemsCount}>
              {itemsCount || 0} {itemsCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  badges: {
    gap: spacing.xs,
  },
  orderNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  customer: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  content: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    marginLeft: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  value: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  totalAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.success.main,
  },
});

export default SalesOrderCard;
