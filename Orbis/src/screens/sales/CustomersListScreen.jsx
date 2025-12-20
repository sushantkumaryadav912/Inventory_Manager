// src/screens/sales/CustomersListScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { ScreenWrapper, EmptyState } from '../../components/layout';
import { SearchBar } from '../../components/ui';
import { CustomerInfo } from '../../components/domain/sales';
import { salesService } from '../../services/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing } from '../../theme';

const CustomersListScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await salesService.getCustomers();
      setCustomers(response.customers || response || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      showErrorAlert(error, 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCustomers();
    setIsRefreshing(false);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search customers..."
          />
        </View>

        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerInfo customer={item} />
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
                title="No customers found"
                description={searchQuery ? "Try a different search term" : "Customers will appear here"}
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

export default CustomersListScreen;
