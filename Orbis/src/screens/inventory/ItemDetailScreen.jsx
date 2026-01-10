// src/screens/inventory/ItemDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Section, LoadingOverlay } from '../../components/layout';
import { Card, Button, Badge } from '../../components/ui';
import { StockLevelIndicator, CategoryBadge } from '../../components/domain/inventory';
import { usePermissions } from '../../hooks/usePermissions';
import { inventoryService } from '../../services/api';
import { PERMISSIONS } from '../../utils/constants';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const ItemDetailScreen = ({ route, navigation }) => {
  const { itemId } = route.params;
  const { can } = usePermissions();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockHistory, setStockHistory] = useState([]);

  useEffect(() => {
    loadItemDetails();
    loadStockHistory();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setIsLoading(true);
      const response = await inventoryService.getItemById(itemId);
      setItem(response.item || response);
    } catch (error) {
      console.error('Failed to load item:', error);
      showErrorAlert(error, 'Failed to load item details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockHistory = async () => {
    try {
      const response = await inventoryService.getStockHistory(itemId, { limit: 10 });
      setStockHistory(response.history || response || []);
    } catch (error) {
      console.error('Failed to load stock history:', error);
    }
  };

  const handleAdjustStock = () => {
    navigation.navigate('AdjustStock', { itemId: item.id, itemName: item.name });
  };

  const handleEdit = () => {
    navigation.navigate('CreateItem', { itemId: item.id, item });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryService.deleteItem(itemId);
              navigation.goBack();
            } catch (error) {
              showErrorAlert(error, 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !item) {
    return <LoadingOverlay visible={true} />;
  }

  const stockStatus = item.quantity === 0
    ? 'out'
    : item.quantity <= item.reorderLevel
    ? 'low'
    : 'in_stock';

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.sku}>SKU: {item.sku}</Text>
            </View>
            <StockLevelIndicator status={stockStatus} />
          </View>

          {item.category && (
            <CategoryBadge category={item.category} style={styles.categoryBadge} />
          )}

          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
        </Card>

        {/* Stock Information */}
        <Section title="Stock Information">
          <Card>
            <View style={styles.infoGrid}>
              <InfoItem
                label="Current Stock"
                value={`${formatNumber(item.quantity)} ${item.unit || 'units'}`}
                variant="large"
              />
              <InfoItem
                label="Reorder Level"
                value={formatNumber(item.reorderLevel)}
              />
              <InfoItem
                label="Cost Price"
                value={formatCurrency(item.costPrice)}
              />
              <InfoItem
                label="Selling Price"
                value={formatCurrency(item.sellingPrice)}
              />
            </View>
          </Card>
        </Section>

        {/* Actions */}
        {can(PERMISSIONS.INVENTORY_ADJUST) && (
          <View style={styles.actions}>
            <Button
              onPress={handleAdjustStock}
              leftIcon={<Ionicons name="swap-horizontal" size={20} color={colors.text.inverse} />}
              fullWidth
            >
              Adjust Stock
            </Button>
          </View>
        )}

        {/* Stock History */}
        {stockHistory.length > 0 && (
          <Section title="Recent Stock Movements">
            <Card>
              {stockHistory.map((movement, index) => (
                <View key={index} style={styles.movementItem}>
                  <View style={styles.movementLeft}>
                    <Text style={styles.movementReason}>{movement.reason}</Text>
                    <Text style={styles.movementDate}>
                      {formatDate(movement.createdAt, 'datetime')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.movementDelta,
                      movement.delta > 0 ? styles.movementPositive : styles.movementNegative,
                    ]}
                  >
                    {movement.delta > 0 ? '+' : ''}{movement.delta}
                  </Text>
                </View>
              ))}
            </Card>
          </Section>
        )}

        {/* Admin Actions */}
        {can(PERMISSIONS.INVENTORY_DELETE) && (
          <View style={styles.adminActions}>
            <Button
              variant="outline"
              onPress={handleEdit}
              fullWidth
            >
              Edit Item
            </Button>
            <Button
              variant="danger"
              onPress={handleDelete}
              fullWidth
            >
              Delete Item
            </Button>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const InfoItem = ({ label, value, variant = 'normal' }) => (
  <View style={[styles.infoItem, variant === 'large' && styles.infoItemLarge]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, variant === 'large' && styles.infoValueLarge]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sku: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  categoryBadge: {
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoItemLarge: {
    minWidth: '100%',
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  infoValueLarge: {
    fontSize: typography.fontSize['2xl'],
    color: colors.primary[600],
  },
  actions: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  movementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  movementLeft: {
    flex: 1,
  },
  movementReason: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  movementDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  movementDelta: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  movementPositive: {
    color: colors.success.main,
  },
  movementNegative: {
    color: colors.error.main,
  },
  adminActions: {
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default ItemDetailScreen;
