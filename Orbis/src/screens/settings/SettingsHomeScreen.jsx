// src/screens/settings/SettingsHomeScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout';
import { Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/constants';
import { colors, spacing, typography } from '../../theme';

const SettingsHomeScreen = ({ navigation }) => {
  const { logout, userId, role } = useAuth();
  const { can } = usePermissions();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        {/* User Info */}
        <Card style={styles.userCard}>
          <View style={styles.userIcon}>
            <Ionicons name="person" size={32} color={colors.primary[600]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>User ID: {userId}</Text>
            <Text style={styles.userRole}>Role: {role?.toUpperCase()}</Text>
          </View>
        </Card>

        {/* Business Settings */}
        {can(PERMISSIONS.SETTINGS_MANAGE) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business</Text>
            <Card style={styles.menuCard}>
              <MenuItem
                icon="business-outline"
                title="Business Profile"
                onPress={() => navigation.navigate('BusinessProfile')}
              />
              <MenuItem
                icon="storefront-outline"
                title="Shop Settings"
                onPress={() => navigation.navigate('ShopSettings')}
                showDivider
              />
            </Card>
          </View>
        )}

        {/* User Management */}
        {can(PERMISSIONS.USERS_MANAGE) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management</Text>
            <Card style={styles.menuCard}>
              <MenuItem
                icon="people-outline"
                title="Users & Roles"
                onPress={() => navigation.navigate('UsersAndRoles')}
              />
            </Card>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Account Settings"
              onPress={() => navigation.navigate('AccountSettings')}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
              showDivider
            />
          </Card>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => Alert.alert('Help', 'Contact support at support@orbis.app')}
            />
            <MenuItem
              icon="information-circle-outline"
              title="About Orbis"
              onPress={() => navigation.navigate('About')}
              showDivider
            />
          </Card>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error.main} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </ScreenWrapper>
  );
};

const MenuItem = ({ icon, title, onPress, showDivider = true }) => (
  <>
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={colors.text.secondary} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
    </TouchableOpacity>
    {showDivider && <View style={styles.divider} />}
  </>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  userIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.md + 24 + spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  logoutText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error.main,
    marginLeft: spacing.sm,
  },
  version: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.xl,
  },
});

export default SettingsHomeScreen;
