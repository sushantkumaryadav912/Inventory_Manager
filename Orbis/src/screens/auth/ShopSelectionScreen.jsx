// src/screens/auth/ShopSelectionScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Card, Button } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';

/**
 * Shop Selection Screen - for multi-shop support (future)
 * Currently not used since backend only supports single shop per user
 */
const ShopSelectionScreen = ({ navigation }) => {
  const [shops] = useState([
    // Mock data - replace with actual shops from backend
    { id: '1', name: 'Main Shop', businessName: 'My Business' },
  ]);
  const [selectedShop, setSelectedShop] = useState(null);

  const handleSelectShop = (shop) => {
    setSelectedShop(shop);
  };

  const handleContinue = () => {
    if (selectedShop) {
      // TODO: Call backend to switch shop context
      // Then navigate to main app
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Select Shop</Text>
        <Text style={styles.subtitle}>
          Choose which shop you want to manage
        </Text>

        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              onPress={() => handleSelectShop(item)}
              style={[
                styles.shopCard,
                selectedShop?.id === item.id && styles.shopCardSelected,
              ]}
            >
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={styles.businessName}>{item.businessName}</Text>
            </Card>
          )}
          contentContainerStyle={styles.list}
        />

        <Button
          onPress={handleContinue}
          disabled={!selectedShop}
          fullWidth
        >
          Continue
        </Button>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  list: {
    flexGrow: 1,
  },
  shopCard: {
    marginBottom: spacing.md,
  },
  shopCardSelected: {
    borderColor: colors.primary[600],
    borderWidth: 2,
  },
  shopName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  businessName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default ShopSelectionScreen;
