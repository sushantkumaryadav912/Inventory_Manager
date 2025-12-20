// src/components/domain/sales/CustomerInfo.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../theme';

const CustomerInfo = ({ customer, onPress, style }) => {
  const { name, phone, email, address, totalPurchases, outstandingBalance } = customer;

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={24} color={colors.primary[600]} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {(totalPurchases !== undefined || outstandingBalance !== undefined) && (
            <View style={styles.stats}>
              {totalPurchases !== undefined && (
                <Text style={styles.statText}>
                  {totalPurchases} orders
                </Text>
              )}
              {outstandingBalance > 0 && (
                <Text style={[styles.statText, styles.outstanding]}>
                  • ₹{outstandingBalance} due
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText}>{phone}</Text>
            <TouchableOpacity onPress={handleCall} style={styles.actionButton}>
              <Ionicons name="call" size={18} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        )}

        {email && (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {email}
            </Text>
            <TouchableOpacity onPress={handleEmail} style={styles.actionButton}>
              <Ionicons name="mail" size={18} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        )}

        {address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.infoText} numberOfLines={2}>
              {address}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  outstanding: {
    color: colors.error.main,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default CustomerInfo;
