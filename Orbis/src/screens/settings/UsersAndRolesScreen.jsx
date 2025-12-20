// src/screens/settings/UsersAndRolesScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, EmptyState } from '../../components/layout';
import { Card, Button, Badge } from '../../components/ui';
import { usersService } from '../../services/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const UsersAndRolesScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersService.getShopUsers();
      setUsers(response.users || response || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      showErrorAlert(error, 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = () => {
    Alert.alert(
      'Invite User',
      'User invitation feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleUserPress = (user) => {
    Alert.alert(
      user.name,
      `Role: ${user.role}\nEmail: ${user.email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          onPress: () => {
            Alert.alert('Coming Soon', 'Role management will be available in the next update');
          },
        },
      ]
    );
  };

  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'success';
      case 'manager':
        return 'info';
      case 'staff':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Users & Roles</Text>
            <Text style={styles.subtitle}>{users.length} team members</Text>
          </View>
          <Button
            size="sm"
            onPress={handleInviteUser}
            leftIcon={<Ionicons name="add" size={18} color={colors.text.inverse} />}
          >
            Invite
          </Button>
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.userCard} onPress={() => handleUserPress(item)}>
              <View style={styles.userIcon}>
                <Ionicons name="person" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <Badge variant={getRoleBadgeVariant(item.role)} size="sm">
                {item.role}
              </Badge>
            </Card>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !isLoading && (
              <EmptyState
                icon="people-outline"
                title="No users found"
                description="Invite team members to collaborate"
                actionLabel="Invite User"
                onAction={handleInviteUser}
              />
            )
          }
        />

        {/* Role Descriptions */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Role Permissions</Text>
          <View style={styles.rolesList}>
            <RoleItem
              role="OWNER"
              description="Full access to all features and settings"
              color={colors.success.main}
            />
            <RoleItem
              role="MANAGER"
              description="Can manage inventory, orders, and view reports"
              color={colors.info.main}
            />
            <RoleItem
              role="STAFF"
              description="Can view inventory and record sales"
              color={colors.gray[600]}
            />
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
};

const RoleItem = ({ role, description, color }) => (
  <View style={styles.roleItem}>
    <View style={[styles.roleDot, { backgroundColor: color }]} />
    <View style={styles.roleContent}>
      <Text style={styles.roleName}>{role}</Text>
      <Text style={styles.roleDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  infoCard: {
    margin: spacing.md,
    backgroundColor: colors.gray[50],
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  rolesList: {
    gap: spacing.md,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  roleContent: {
    flex: 1,
  },
  roleName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default UsersAndRolesScreen;
