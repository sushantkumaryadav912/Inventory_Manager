// src/screens/purchases/PurchaseOrdersListScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, EmptyState } from '../../components/layout';
import { SearchBar, Button } from '../../components/ui';
import { PurchaseOrderCard } from '../../components/domain/purchases';
import { usePermissions } from '../../hooks/usePermissions';
import { useDebounce } from '../../hooks/useDebounce';
import { purchaseService } from '../../services/api';
import { PERMISSIONS } from '../../utils/constants';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing } from '../../theme';

const PurchaseOrdersListScreen = ({ navigation }) => {
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
      const response = await purchaseService.getPurchaseOrders(params);
      setOrders(response.orders || response || []);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      showErrorAlert(error, 'Failed to load purchase orders');
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
    navigation.navigate('PurchaseOrderDetail', { orderId: order.id });
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreatePurchaseOrder');
  };

  const handleViewSuppliers = () => {
    navigation.navigate('SuppliersList');
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

        {can(PERMISSIONS.PURCHASES_CREATE) && (
          <View style={styles.actions}>
            <Button
              onPress={handleCreateOrder}
              leftIcon={<Ionicons name="add" size={20} color={colors.text.inverse} />}
              style={styles.actionButton}
            >
              New Order
            </Button>
            <TouchableOpacity onPress={handleViewSuppliers} style={styles.suppliersButton}>
              <Ionicons name="people-outline" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PurchaseOrderCard
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
                icon="cart-outline"
                title="No purchase orders"
                description={searchQuery ? "Try a different search term" : "Create your first purchase order"}
                actionLabel={can(PERMISSIONS.PURCHASES_CREATE) ? "Create Order" : undefined}
                onAction={can(PERMISSIONS.PURCHASES_CREATE) ? handleCreateOrder : undefined}
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
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  suppliersButton: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    flexGrow: 1,
  },
});

export default PurchaseOrdersListScreen;
