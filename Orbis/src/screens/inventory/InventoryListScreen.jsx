// src/screens/inventory/InventoryListScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, EmptyState } from '../../components/layout';
import { SearchBar, Button } from '../../components/ui';
import { ItemCard } from '../../components/domain/inventory';
import { usePermissions } from '../../hooks/usePermissions';
import { useDebounce } from '../../hooks/useDebounce';
import { inventoryService } from '../../services/api';
import { PERMISSIONS } from '../../utils/constants';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing } from '../../theme';

const InventoryListScreen = ({ navigation }) => {
  const { can } = usePermissions();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    loadItems();
  }, [debouncedSearch]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await inventoryService.getItems(params);
      setItems(response.items || response || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      showErrorAlert(error, 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  }, [debouncedSearch]);

  const handleItemPress = (item) => {
    navigation.navigate('ItemDetail', { itemId: item.id });
  };

  const handleAddItem = () => {
    navigation.navigate('CreateItem');
  };

  const handleBulkImport = () => {
    navigation.navigate('BulkImport');
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items..."
          />
        </View>

        {/* Action Buttons */}
        {can(PERMISSIONS.INVENTORY_CREATE) && (
          <View style={styles.actions}>
            <Button
              onPress={handleAddItem}
              leftIcon={<Ionicons name="add" size={20} color={colors.text.inverse} />}
              style={styles.actionButton}
            >
              Add Item
            </Button>
            <TouchableOpacity onPress={handleBulkImport} style={styles.importButton}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Items List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => handleItemPress(item)}
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
                icon="cube-outline"
                title="No items found"
                description={searchQuery ? "Try a different search term" : "Add your first inventory item to get started"}
                actionLabel={can(PERMISSIONS.INVENTORY_CREATE) ? "Add Item" : undefined}
                onAction={can(PERMISSIONS.INVENTORY_CREATE) ? handleAddItem : undefined}
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
  importButton: {
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

export default InventoryListScreen;
