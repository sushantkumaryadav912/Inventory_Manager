// src/screens/settings/AccountSettingsScreen.jsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper, LoadingOverlay } from '../../components/layout';
import { Input, Button, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { authService, settingsService } from '../../services/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const AccountSettingsScreen = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [currentUser])
  );

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser();
      const userData = response.user || response;
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || userData.phoneNumber || '',
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to context user data
      if (currentUser) {
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
        });
      }
      showErrorAlert(error, 'Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await settingsService.updateAccount({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      showSuccessAlert('Account updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update account:', error);
      showErrorAlert(error, 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password management is handled by Neon authentication.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account deletion will be available in the next update');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Account Settings</Text>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.form}>
            <Input
              label="Full Name *"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              helperText="Your display name in the system"
            />

            <Input
              label="Email Address *"
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              helperText="Used for login and notifications"
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              helperText="Contact number (optional)"
            />

            <Button
              onPress={handleSave}
              loading={isSubmitting}
              fullWidth
            >
              Save Changes
            </Button>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Card>
            <Button
              variant="outline"
              onPress={handleChangePassword}
              fullWidth
            >
              Change Password
            </Button>
          </Card>
        </View>

        {/* Connected Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Account</Text>
          <Card style={styles.neonCard}>
            <View style={styles.neonBadge}>
              <Text style={styles.neonBadgeText}>NEON</Text>
            </View>
            <Text style={styles.neonText}>
              Your account is connected via Neon authentication
            </Text>
            <Text style={styles.userId}>User ID: {currentUser?.id || 'N/A'}</Text>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerText}>
              Once you delete your account, there is no going back. Please be certain.
            </Text>
            <Button
              variant="danger"
              onPress={handleDeleteAccount}
              fullWidth
            >
              Delete My Account
            </Button>
          </Card>
        </View>
      </ScrollView>
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
    marginBottom: spacing.xl,
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
  form: {
    gap: spacing.md,
  },
  neonCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  neonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  neonBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  neonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  userId: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  dangerCard: {
    backgroundColor: colors.error.light,
    borderColor: colors.error.main,
  },
  dangerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error.dark,
    marginBottom: spacing.sm,
  },
  dangerText: {
    fontSize: typography.fontSize.sm,
    color: colors.error.dark,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
});

export default AccountSettingsScreen;
