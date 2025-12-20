// src/screens/purchases/SuppliersListScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { ScreenWrapper, EmptyState } from '../../components/layout';
import { SearchBar, Button } from '../../components/ui';
import { SupplierInfo } from '../../components/domain/purchases';
import { purchaseService } from '../../services/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing } from '../../theme';

const SuppliersListScreen = ({ navigation }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await purchaseService.getSuppliers();
      setSuppliers(response.suppliers || response || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      showErrorAlert(error, 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSuppliers();
    setIsRefreshing(false);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search suppliers..."
          />
        </View>

        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SupplierInfo supplier={item} />
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
                icon="people-outline"
                title="No suppliers found"
                description={searchQuery ? "Try a different search term" : "Add your first supplier"}
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
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
});

export default SuppliersListScreen;
