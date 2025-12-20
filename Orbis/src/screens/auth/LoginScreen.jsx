// src/screens/auth/LoginScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';

/**
 * Login Screen - Neon Auth Integration
 * TODO: Integrate actual Neon SDK for authentication
 */
const LoginScreen = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual Neon SDK integration
      // Example: const neonToken = await NeonAuth.signIn();
      
      // For development, using mock token
      // Replace this with actual Neon authentication flow
      const mockNeonToken = 'mock_neon_token_' + Date.now();
      
      Alert.alert(
        'Development Mode',
        'Using mock authentication. Integrate Neon SDK for production.',
        [
          {
            text: 'Continue',
            onPress: async () => {
              try {
                await login(mockNeonToken);
              } catch (error) {
                Alert.alert('Login Failed', error.message || 'Unable to login');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to initiate login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/splashscreen/splash.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to Orbis</Text>
          <Text style={styles.subtitle}>
            Premium Inventory & Business Management
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.features}>
            <FeatureItem
              icon="📦"
              title="Inventory Management"
              description="Track stock levels in real-time"
            />
            <FeatureItem
              icon="📊"
              title="Business Analytics"
              description="Insights to grow your business"
            />
            <FeatureItem
              icon="🔒"
              title="Secure & Reliable"
              description="Enterprise-grade security"
            />
          </View>

          <View style={styles.actions}>
            <Button
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            >
              Sign In with Neon
            </Button>
            
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
});

export default LoginScreen;
