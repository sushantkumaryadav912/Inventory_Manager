// src/components/domain/inventory/StockLevelIndicator.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../../theme';

const StockLevelIndicator = ({ status, size = 'md', showLabel = true }) => {
  const getConfig = () => {
    switch (status) {
      case 'out':
        return {
          label: 'Out of Stock',
          color: colors.stock.out,
          bgColor: colors.gray[100],
        };
      case 'low':
        return {
          label: 'Low Stock',
          color: colors.stock.low,
          bgColor: colors.error.light,
        };
      case 'medium':
        return {
          label: 'Medium Stock',
          color: colors.stock.medium,
          bgColor: colors.warning.light,
        };
      case 'in_stock':
      default:
        return {
          label: 'In Stock',
          color: colors.stock.high,
          bgColor: colors.success.light,
        };
    }
  };

  const config = getConfig();
  const sizeStyles = size === 'sm' ? styles.small : styles.medium;

  return (
    <View style={[styles.container, sizeStyles, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

export default StockLevelIndicator;
