// src/components/charts/PieChart.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Simple pie chart legend component
 * For actual pie visualization, use react-native-svg + d3-shape
 * or a charting library like react-native-chart-kit
 */
const PieChart = ({ data, title, style }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.legend}>
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          
          return (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.colorBox,
                  { backgroundColor: item.color || colors.primary[600] },
                ]}
              />
              <View style={styles.legendText}>
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>{item.value}</Text>
                  <Text style={styles.percentage}>({percentage}%)</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  legend: {
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  percentage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  noData: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default PieChart;
