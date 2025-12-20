// src/components/ui/Button.jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const Button = ({
  children,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...props
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.inverse : colors.primary[600]}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={textStyles}>{children}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  secondary: {
    backgroundColor: colors.gray[200],
    borderColor: colors.gray[200],
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary[600],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error.main,
    borderColor: colors.error.main,
  },

  // Sizes
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },

  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  primaryText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
  },
  secondaryText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  outlineText: {
    color: colors.primary[600],
    fontSize: typography.fontSize.base,
  },
  ghostText: {
    color: colors.primary[600],
    fontSize: typography.fontSize.base,
  },
  dangerText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
  },
  smText: {
    fontSize: typography.fontSize.sm,
  },
  mdText: {
    fontSize: typography.fontSize.base,
  },
  lgText: {
    fontSize: typography.fontSize.lg,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button;
