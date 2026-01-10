// src/screens/reports/OverviewReportScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Section } from '../../components/layout';
import { Card } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { reportsService } from '../../services/api';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const OverviewReportScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await reportsService.getOverviewStats();
      setStats(response.stats || response);
    } catch (error) {
      console.error('Failed to load stats:', error);
      showErrorAlert(error, 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const salesChartData = stats?.weeklySales && stats.weeklySales.length > 0
    ? stats.weeklySales.map(item => ({
        label: item.day || item.label,
        value: item.value || item.sales || 0,
        color: colors.primary[600],
      }))
    : [
        { label: 'Mon', value: 0, color: colors.primary[600] },
        { label: 'Tue', value: 0, color: colors.primary[600] },
        { label: 'Wed', value: 0, color: colors.primary[600] },
        { label: 'Thu', value: 0, color: colors.primary[600] },
        { label: 'Fri', value: 0, color: colors.primary[600] },
        { label: 'Sat', value: 0, color: colors.primary[600] },
        { label: 'Sun', value: 0, color: colors.primary[600] },
      ];

  const navigateToReport = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Business Overview</Text>

        {/* Key Metrics */}
        <Section title="Key Metrics">
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="trending-up"
              label="Total Sales"
              value={formatCurrency(stats?.totalSales || 0)}
              color={colors.success.main}
            />
            <MetricCard
              icon="cart"
              label="Purchases"
              value={formatCurrency(stats?.totalPurchases || 0)}
              color={colors.warning.main}
            />
            <MetricCard
              icon="cube"
              label="Inventory Value"
              value={formatCurrency(stats?.inventoryValue || 0)}
              color={colors.info.main}
            />
            <MetricCard
              icon="cash"
              label="Profit"
              value={formatCurrency(stats?.profit || 0)}
              color={colors.primary[600]}
            />
          </View>
        </Section>

        {/* Sales Chart */}
        <Section title="Sales This Week">
          <Card>
            <BarChart
              data={salesChartData}
              height={220}
              showValues={true}
            />
          </Card>
        </Section>

        {/* Quick Links */}
        <Section title="Detailed Reports">
          <View style={styles.reportLinks}>
            <ReportLinkCard
              icon="cube-outline"
              title="Inventory Report"
              description="Stock levels, low stock alerts"
              onPress={() => navigateToReport('InventoryReport')}
            />
            <ReportLinkCard
              icon="trending-up-outline"
              title="Sales Report"
              description="Sales trends and performance"
              onPress={() => navigateToReport('SalesReport')}
            />
            <ReportLinkCard
              icon="cart-outline"
              title="Purchases Report"
              description="Purchase orders and suppliers"
              onPress={() => navigateToReport('PurchasesReport')}
            />
          </View>
        </Section>

        {/* Alerts */}
        {stats?.lowStockItems > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color={colors.warning.dark} />
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
            </View>
            <Text style={styles.alertText}>
              {stats.lowStockItems} items are running low on stock
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => navigation.navigate('InventoryTab')}
            >
              <Text style={styles.alertButtonText}>View Items</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const MetricCard = ({ icon, label, value, color }) => (
  <Card style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </Card>
);

const ReportLinkCard = ({ icon, title, description, onPress }) => (
  <TouchableOpacity style={styles.reportLink} onPress={onPress}>
    <View style={styles.reportLinkIcon}>
      <Ionicons name={icon} size={28} color={colors.primary[600]} />
    </View>
    <View style={styles.reportLinkContent}>
      <Text style={styles.reportLinkTitle}>{title}</Text>
      <Text style={styles.reportLinkDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
  </TouchableOpacity>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  reportLinks: {
    gap: spacing.md,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  reportLinkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reportLinkContent: {
    flex: 1,
  },
  reportLinkTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reportLinkDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  alertCard: {
    backgroundColor: colors.warning.light,
    borderColor: colors.warning.main,
    marginTop: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning.dark,
    marginLeft: spacing.sm,
  },
  alertText: {
    fontSize: typography.fontSize.base,
    color: colors.warning.dark,
    marginBottom: spacing.md,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
    marginRight: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default OverviewReportScreen;
