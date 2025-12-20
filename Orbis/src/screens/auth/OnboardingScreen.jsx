// src/screens/auth/OnboardingScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

/**
 * OnboardingScreen used as Sign Up:
 * - name
 * - email
 * - password
 */
const OnboardingScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGetStarted = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      Alert.alert('Missing details', 'Please fill in all fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      // After sign up, user is logged in; AppNavigator will switch to main app.
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Create your Orbis account</Text>
          <Text style={styles.subtitle}>
            Get started with your business management system
          </Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Your name"
              value={form.name}
              onChangeText={(v) => handleChange('name', v)}
            />
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
              placeholder="Create a password"
              value={form.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry
            />

            <Text
              style={styles.linkText}
              onPress={goToLogin}
            >
              Already have an account? Sign in
            </Text>
          </View>

          <View style={styles.steps}>
            <StepItem
              number="1"
              title="Set up your inventory"
              description="Add products and track stock levels."
            />
            <StepItem
              number="2"
              title="Manage purchases & sales"
              description="Record orders and transactions."
            />
            <StepItem
              number="3"
              title="View reports"
              description="Get insights about your business."
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button
            onPress={handleGetStarted}
            loading={isLoading}
            fullWidth
            size="lg"
          >
            Create Account
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const StepItem = ({ number, title, description }) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  emoji: {
    fontSize: 80,
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
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  steps: {
    width: '100%',
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  actions: {
    paddingTop: spacing.xl,
  },
  linkText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    textAlign: 'right',
  },
});

export default OnboardingScreen;
