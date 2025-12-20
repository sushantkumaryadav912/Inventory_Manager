// src/components/layout/LoadingOverlay.jsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { colors, spacing, typography } from '../../theme';

const LoadingOverlay = ({
  visible = false,
  message = 'Loading...',
  transparent = true,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator
            size="large"
            color={colors.primary[600]}
          />
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.xl,
    minWidth: 150,
    alignItems: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
