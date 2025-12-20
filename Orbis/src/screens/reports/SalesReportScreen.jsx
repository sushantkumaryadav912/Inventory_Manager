// src/screens/reports/SalesReportScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper, Section } from '../../components/layout';
import { Card } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { reportsService } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const SalesReportScreen = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const response = await reportsService.getSalesReport();
      setReport(response.report || response);
    } catch (error) {
      console.error('Failed to load sales report:', error);
      showErrorAlert(error, 'Failed to load sales report');
    } finally {
      setIsLoading(false);
    }
  };

  const monthlySalesData = [
    { label: 'Jan', value: 50000, color: colors.success.main },
    { label: 'Feb', value: 65000, color: colors.success.main },
    { label: 'Mar', value: 58000, color: colors.success.main },
    { label: 'Apr', value: 72000, color: colors.success.main },
    { label: 'May', value: 68000, color: colors.success.main },
    { label: 'Jun', value: 85000, color: colors.success.main },
  ];

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Sales Report</Text>

        {/* Summary Stats */}
        <Section title="This Month">
          <Card>
            <View style={styles.statsRow}>
              <StatItem
                label="Total Sales"
                value={formatCurrency(report?.totalSales || 0)}
                color={colors.success.main}
              />
              <StatItem
                label="Orders"
                value={formatNumber(report?.totalOrders || 0)}
              />
            </View>
            <View style={styles.statsRow}>
              <StatItem
                label="Avg. Order Value"
                value={formatCurrency(report?.avgOrderValue || 0)}
              />
              <StatItem
                label="Profit Margin"
                value={`${report?.profitMargin || 0}%`}
                color={colors.primary[600]}
              />
            </View>
          </Card>
        </Section>

        {/* Monthly Trend */}
        <Section title="Monthly Sales Trend">
          <Card>
            <BarChart
              data={monthlySalesData}
              height={220}
              showValues={true}
            />
          </Card>
        </Section>

        {/* Top Products */}
        <Section title="Best Selling Products">
          <Card>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.productItem}>
                <View style={styles.productLeft}>
                  <Text style={styles.rank}>#{item}</Text>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>Product {item}</Text>
                    <Text style={styles.productQuantity}>50 units sold</Text>
                  </View>
                </View>
                <Text style={styles.productRevenue}>{formatCurrency(25000)}</Text>
              </View>
            ))}
          </Card>
        </Section>
      </ScrollView>
    </ScreenWrapper>
  );
};

const StatItem = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
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
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  productLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    width: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  productQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  productRevenue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success.main,
  },
});

export default SalesReportScreen;
