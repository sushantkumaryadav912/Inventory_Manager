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

  const monthlySalesData = report?.monthlySales && report.monthlySales.length > 0
    ? report.monthlySales.map(item => ({
        label: item.month || item.label,
        value: item.value || item.sales || 0,
        color: colors.success.main,
      }))
    : [
        { label: 'Jan', value: 0, color: colors.success.main },
        { label: 'Feb', value: 0, color: colors.success.main },
        { label: 'Mar', value: 0, color: colors.success.main },
        { label: 'Apr', value: 0, color: colors.success.main },
        { label: 'May', value: 0, color: colors.success.main },
        { label: 'Jun', value: 0, color: colors.success.main },
      ];

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
            {(report?.topProducts && report.topProducts.length > 0) ? (
              report.topProducts.map((product, index) => (
                <View key={product.id || index} style={styles.productItem}>
                  <View style={styles.productLeft}>
                    <Text style={styles.rank}>#{index + 1}</Text>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name || `Product ${index + 1}`}</Text>
                      <Text style={styles.productQuantity}>{product.quantity || 0} units sold</Text>
                    </View>
                  </View>
                  <Text style={styles.productRevenue}>{formatCurrency(product.revenue || 0)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyText}>No sales data available</Text>
              </View>
            )}
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
  emptyProducts: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default SalesReportScreen;
