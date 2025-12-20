// src/screens/auth/OnboardingScreen.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/layout';
import { Button } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';

/**
 * Onboarding screen for new shops
 * Can be shown after successful authentication for first-time users
 */
const OnboardingScreen = ({ navigation }) => {
  const handleGetStarted = () => {
    // Navigation will be handled by AppNavigator automatically
    // This screen is just informational
  };

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Welcome to Orbis!</Text>
          <Text style={styles.subtitle}>
            Your business management system is ready
          </Text>

          <View style={styles.steps}>
            <StepItem
              number="1"
              title="Set up your inventory"
              description="Add products and track stock levels"
            />
            <StepItem
              number="2"
              title="Manage purchases & sales"
              description="Record orders and transactions"
            />
            <StepItem
              number="3"
              title="View reports"
              description="Get insights about your business"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={handleGetStarted}
            fullWidth
            size="lg"
          >
            Get Started
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: spacing.xxl,
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
});

export default OnboardingScreen;
