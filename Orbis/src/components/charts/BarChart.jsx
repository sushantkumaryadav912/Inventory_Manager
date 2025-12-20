// src/components/charts/BarChart.jsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, typography } from '../../theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - (spacing.md * 4);
const BAR_WIDTH = 40;

/**
 * Simple bar chart component
 * For production, consider using react-native-chart-kit or victory-native
 */
const BarChart = ({ data, title, height = 200, showValues = true, style }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const scale = (height - 40) / maxValue;

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={[styles.chartContainer, { height }]}>
        {data.map((item, index) => {
          const barHeight = item.value * scale;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                {showValues && (
                  <Text style={styles.value}>{item.value}</Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: item.color || colors.primary[600],
                    },
                  ]}
                />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: BAR_WIDTH + 20,
  },
  barWrapper: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  value: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  noData: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default BarChart;
