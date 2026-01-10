// src/screens/sales/SalesOrdersListScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, EmptyState } from '../../components/layout';
import { SearchBar, Button } from '../../components/ui';
import { SalesOrderCard } from '../../components/domain/sales';
import { usePermissions } from '../../hooks/usePermissions';
import { useDebounce } from '../../hooks/useDebounce';
import { salesService } from '../../services/api';
import { PERMISSIONS } from '../../utils/constants';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing } from '../../theme';

const SalesOrdersListScreen = ({ navigation }) => {
  const { can } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    loadOrders();
  }, [debouncedSearch]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await salesService.getSalesOrders(params);
      const rawOrders = response.orders || response || [];
      
      // Transform backend data to frontend format
      const transformedOrders = rawOrders.map(order => ({
        id: order.id,
        orderNumber: order.id?.slice(0, 8).toUpperCase() || 'N/A',
        customer: order.customers ? {
          id: order.customers.id,
          name: order.customers.name,
          email: order.customers.email,
          phone: order.customers.phone,
        } : null,
        orderDate: order.created_at || new Date(),
        status: 'completed', // Default status
        paymentStatus: order.payment_method ? 'paid' : 'pending',
        totalAmount: parseFloat(order.total_amount) || 0,
        itemsCount: order.sale_items?.length || 0,
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Failed to load sales orders:', error);
      showErrorAlert(error, 'Failed to load sales orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  }, [debouncedSearch]);

  const handleOrderPress = (order) => {
    navigation.navigate('SaleDetail', { orderId: order.id });
  };

  const handleRecordSale = () => {
    navigation.navigate('RecordSale');
  };

  const handleViewCustomers = () => {
    navigation.navigate('CustomersList');
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders..."
          />
        </View>

        {can(PERMISSIONS.SALES_CREATE) && (
          <View style={styles.actions}>
            <Button
              onPress={handleRecordSale}
              leftIcon={<Ionicons name="add" size={20} color={colors.text.inverse} />}
              style={styles.actionButton}
            >
              Record Sale
            </Button>
          </View>
        )}

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SalesOrderCard
              order={item}
              onPress={() => handleOrderPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[600]}
            />
          }
          ListEmptyComponent={
            !isLoading && (
              <EmptyState
                icon="cash-outline"
                title="No sales orders"
                description={searchQuery ? "Try a different search term" : "Record your first sale"}
                actionLabel={can(PERMISSIONS.SALES_CREATE) ? "Record Sale" : undefined}
                onAction={can(PERMISSIONS.SALES_CREATE) ? handleRecordSale : undefined}
              />
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },
});

export default SalesOrdersListScreen;
