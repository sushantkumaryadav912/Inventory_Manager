// src/screens/settings/AboutScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout';
import { Card } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';

const AboutScreen = () => {
  const handleOpenLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* App Logo/Name */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="cube" size={64} color={colors.primary[600]} />
          </View>
          <Text style={styles.appName}>Orbis</Text>
          <Text style={styles.tagline}>Premium Inventory Management</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Description */}
        <Card style={styles.descriptionCard}>
          <Text style={styles.description}>
            Orbis is a comprehensive business management solution designed for modern businesses. 
            Manage your inventory, track sales and purchases, and get valuable insights to grow your business.
          </Text>
        </Card>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Card>
            <FeatureItem icon="cube-outline" text="Real-time inventory tracking" />
            <FeatureItem icon="cart-outline" text="Purchase order management" />
            <FeatureItem icon="cash-outline" text="Sales order tracking" />
            <FeatureItem icon="bar-chart-outline" text="Business analytics & reports" />
            <FeatureItem icon="people-outline" text="Role-based access control" />
            <FeatureItem icon="shield-checkmark-outline" text="Secure data management" showDivider={false} />
          </Card>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <Card>
            <LinkItem
              icon="document-text-outline"
              text="Privacy Policy"
              onPress={() => handleOpenLink('https://orbis.app/privacy')}
            />
            <LinkItem
              icon="shield-outline"
              text="Terms of Service"
              onPress={() => handleOpenLink('https://orbis.app/terms')}
            />
            <LinkItem
              icon="help-circle-outline"
              text="Help & Support"
              onPress={() => handleOpenLink('https://orbis.app/support')}
            />
            <LinkItem
              icon="globe-outline"
              text="Visit Website"
              onPress={() => handleOpenLink('https://orbis.app')}
              showDivider={false}
            />
          </Card>
        </View>

        {/* Credits */}
        <Card style={styles.creditsCard}>
          <Text style={styles.creditsTitle}>Powered by Neon</Text>
          <Text style={styles.creditsText}>
            Authentication and user management powered by Neon, the next-generation identity platform.
          </Text>
        </Card>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2025 Orbis. All rights reserved.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const FeatureItem = ({ icon, text, showDivider = true }) => (
  <>
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color={colors.primary[600]} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
    {showDivider && <View style={styles.divider} />}
  </>
);

const LinkItem = ({ icon, text, onPress, showDivider = true }) => (
  <>
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <View style={styles.linkLeft}>
        <Ionicons name={icon} size={20} color={colors.text.secondary} />
        <Text style={styles.linkText}>{text}</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.gray[400]} />
    </TouchableOpacity>
    {showDivider && <View style={styles.divider} />}
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  descriptionCard: {
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  creditsCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    marginBottom: spacing.xl,
  },
  creditsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  creditsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  copyright: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default AboutScreen;
