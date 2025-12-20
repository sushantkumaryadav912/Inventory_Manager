// src/components/ui/Badge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const Badge = ({
  children,
  variant = 'default', // default, success, warning, error, info
  size = 'md', // sm, md, lg
  style,
  textStyle,
}) => {
  const badgeStyles = [
    styles.badge,
    styles[variant],
    styles[size],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },

  // Variants
  default: {
    backgroundColor: colors.gray[200],
  },
  success: {
    backgroundColor: colors.success.light,
  },
  warning: {
    backgroundColor: colors.warning.light,
  },
  error: {
    backgroundColor: colors.error.light,
  },
  info: {
    backgroundColor: colors.info.light,
  },

  // Sizes
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  defaultText: {
    color: colors.gray[700],
  },
  successText: {
    color: colors.success.dark,
  },
  warningText: {
    color: colors.warning.dark,
  },
  errorText: {
    color: colors.error.dark,
  },
  infoText: {
    color: colors.info.dark,
  },
  smText: {
    fontSize: typography.fontSize.xs,
  },
  mdText: {
    fontSize: typography.fontSize.sm,
  },
  lgText: {
    fontSize: typography.fontSize.base,
  },
});

export default Badge;
