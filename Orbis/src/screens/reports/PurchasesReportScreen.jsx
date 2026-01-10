// src/screens/reports/PurchasesReportScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper, Section } from '../../components/layout';
import { Card } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { reportsService } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const PurchasesReportScreen = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const response = await reportsService.getPurchasesReport();
      setReport(response.report || response);
    } catch (error) {
      console.error('Failed to load purchases report:', error);
      showErrorAlert(error, 'Failed to load purchases report');
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyPurchasesData = report?.monthlyPurchases && report.monthlyPurchases.length > 0
    ? report.monthlyPurchases.map(item => ({
        label: item.month || item.label,
        value: item.value || item.purchases || 0,
        color: colors.warning.main,
      }))
    : [
        { label: 'Jan', value: 0, color: colors.warning.main },
        { label: 'Feb', value: 0, color: colors.warning.main },
        { label: 'Mar', value: 0, color: colors.warning.main },
        { label: 'Apr', value: 0, color: colors.warning.main },
        { label: 'May', value: 0, color: colors.warning.main },
        { label: 'Jun', value: 0, color: colors.warning.main },
      ];

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Purchases Report</Text>

        {/* Summary Stats */}
        <Section title="This Month">
          <Card>
            <View style={styles.statsRow}>
              <StatItem
                label="Total Purchases"
                value={formatCurrency(report?.totalPurchases || 0)}
                color={colors.warning.main}
              />
              <StatItem
                label="Orders"
                value={formatNumber(report?.totalOrders || 0)}
              />
            </View>
            <View style={styles.statsRow}>
              <StatItem
                label="Pending Orders"
                value={formatNumber(report?.pendingOrders || 0)}
              />
              <StatItem
                label="Suppliers"
                value={formatNumber(report?.totalSuppliers || 0)}
              />
            </View>
          </Card>
        </Section>

        {/* Monthly Trend */}
        <Section title="Monthly Purchases Trend">
          <Card>
            <BarChart
              data={monthlyPurchasesData}
              height={220}
              showValues={true}
            />
          </Card>
        </Section>

        {/* Top Suppliers */}
        <Section title="Top Suppliers">
          <Card>
            {(report?.topSuppliers && report.topSuppliers.length > 0) ? (
              report.topSuppliers.map((supplier, index) => (
                <View key={supplier.id || index} style={styles.supplierItem}>
                  <View style={styles.supplierLeft}>
                    <Text style={styles.rank}>#{index + 1}</Text>
                    <View style={styles.supplierInfo}>
                      <Text style={styles.supplierName}>{supplier.name || `Supplier ${index + 1}`}</Text>
                      <Text style={styles.supplierOrders}>{supplier.orders || 0} orders</Text>
                    </View>
                  </View>
                  <Text style={styles.supplierAmount}>{formatCurrency(supplier.amount || 0)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptySuppliers}>
                <Text style={styles.emptyText}>No purchase data available</Text>
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
  supplierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  supplierLeft: {
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
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  supplierOrders: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  supplierAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning.main,
  },
  emptySuppliers: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
});

export default PurchasesReportScreen;
