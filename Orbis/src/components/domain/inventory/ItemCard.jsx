// src/components/domain/inventory/ItemCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import StockLevelIndicator from './StockLevelIndicator';
import CategoryBadge from './CategoryBadge';

const ItemCard = ({ item, onPress, style }) => {
  const {
    name,
    sku,
    category,
    quantity,
    unit,
    costPrice,
    sellingPrice,
    reorderLevel,
  } = item;

  const stockStatus = quantity === 0 
    ? 'out' 
    : quantity <= reorderLevel 
    ? 'low' 
    : 'in_stock';

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.sku}>SKU: {sku}</Text>
        </View>
        <StockLevelIndicator status={stockStatus} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Stock</Text>
            <Text style={styles.value}>
              {formatNumber(quantity)} {unit || 'units'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Cost Price</Text>
            <Text style={styles.value}>{formatCurrency(costPrice)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Selling Price</Text>
            <Text style={styles.value}>{formatCurrency(sellingPrice)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {category && <CategoryBadge category={category} />}
          
          {quantity <= reorderLevel && quantity > 0 && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={14} color={colors.warning.dark} />
              <Text style={styles.warningText}>Low Stock</Text>
            </View>
          )}
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
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sku: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  content: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning.dark,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.xs,
  },
});

export default ItemCard;
