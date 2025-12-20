// src/screens/auth/LoginScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) {
      Alert.alert('Missing details', 'Please enter email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      // After successful login, AppNavigator will switch to the main app based on isAuthenticated.
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToOnboarding = () => {
    // Use Onboarding as a signup screen
    navigation.navigate('Onboarding');
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
            Sign in with your email and password
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry
            />

            <Text
              style={styles.linkText}
              onPress={goToOnboarding}
            >
              New here? Create an account
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            >
              Sign In
            </Button>

            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

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
  form: {
    gap: spacing.md,
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
  linkText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    textAlign: 'right',
  },
});

export default LoginScreen;
