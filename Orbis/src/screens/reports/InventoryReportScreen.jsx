// src/screens/reports/InventoryReportScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper, Section } from '../../components/layout';
import { Card } from '../../components/ui';
import { PieChart } from '../../components/charts';
import { reportsService } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const InventoryReportScreen = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const response = await reportsService.getInventoryReport();
      setReport(response.report || response);
    } catch (error) {
      console.error('Failed to load inventory report:', error);
      showErrorAlert(error, 'Failed to load inventory report');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryData = [
    { label: 'Electronics', value: 45, color: colors.primary[600] },
    { label: 'Clothing', value: 30, color: colors.success.main },
    { label: 'Food', value: 15, color: colors.warning.main },
    { label: 'Others', value: 10, color: colors.info.main },
  ];

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Inventory Report</Text>

        {/* Summary Stats */}
        <Section title="Summary">
          <Card>
            <View style={styles.statsRow}>
              <StatItem
                label="Total Items"
                value={formatNumber(report?.totalItems || 0)}
              />
              <StatItem
                label="Total Value"
                value={formatCurrency(report?.totalValue || 0)}
              />
            </View>
            <View style={styles.statsRow}>
              <StatItem
                label="Low Stock"
                value={formatNumber(report?.lowStockItems || 0)}
                highlight={report?.lowStockItems > 0}
              />
              <StatItem
                label="Out of Stock"
                value={formatNumber(report?.outOfStockItems || 0)}
                highlight={report?.outOfStockItems > 0}
              />
            </View>
          </Card>
        </Section>

        {/* Category Distribution */}
        <Section title="Stock by Category">
          <Card>
            <PieChart data={categoryData} />
          </Card>
        </Section>

        {/* Top Items */}
        <Section title="Top Items by Value">
          <Card>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.topItem}>
                <View style={styles.topItemLeft}>
                  <Text style={styles.topItemName}>Item {item}</Text>
                  <Text style={styles.topItemQuantity}>Qty: 100</Text>
                </View>
                <Text style={styles.topItemValue}>{formatCurrency(10000)}</Text>
              </View>
            ))}
          </Card>
        </Section>
      </ScrollView>
    </ScreenWrapper>
  );
};

const StatItem = ({ label, value, highlight = false }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statValueHighlight: {
    color: colors.warning.main,
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  topItemLeft: {
    flex: 1,
  },
  topItemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  topItemQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  topItemValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
});

export default InventoryReportScreen;
