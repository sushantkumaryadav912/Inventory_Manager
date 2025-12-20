// src/screens/inventory/BulkImportScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { inventoryService } from '../../services/api';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { colors, spacing, typography } from '../../theme';

const BulkImportScreen = ({ navigation }) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'CSV template will be downloaded to your device.',
      [{ text: 'OK' }]
    );
    // TODO: Implement CSV template download
  };

  const handleSelectFile = async () => {
    try {
      // TODO: Implement file picker
      // const result = await DocumentPicker.getDocumentAsync({
      //   type: 'text/csv',
      // });
      
      Alert.alert(
        'Feature Coming Soon',
        'Bulk import functionality will be available in the next update.'
      );
    } catch (error) {
      console.error('File selection error:', error);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Bulk Import Items</Text>
        <Text style={styles.subtitle}>
          Import multiple items at once using a CSV file
        </Text>

        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.steps}>
            <StepItem number="1" text="Download the CSV template" />
            <StepItem number="2" text="Fill in your item data" />
            <StepItem number="3" text="Upload the completed file" />
            <StepItem number="4" text="Review and confirm import" />
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={handleDownloadTemplate}
            leftIcon={<Ionicons name="download-outline" size={20} color={colors.primary[600]} />}
            fullWidth
          >
            Download Template
          </Button>

          <Button
            onPress={handleSelectFile}
            loading={isImporting}
            leftIcon={<Ionicons name="cloud-upload-outline" size={20} color={colors.text.inverse} />}
            fullWidth
          >
            Select File to Import
          </Button>
        </View>

        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={colors.warning.dark} />
            <Text style={styles.warningTitle}>Important Notes</Text>
          </View>
          <Text style={styles.warningText}>
            • Ensure all required fields are filled{'\n'}
            • Duplicate SKUs will be skipped{'\n'}
            • Invalid data will be reported{'\n'}
            • Review all items before final confirmation
          </Text>
        </Card>
      </View>
    </ScreenWrapper>
  );
};

const StepItem = ({ number, text }) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  instructionsCard: {
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  steps: {
    gap: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  stepText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  warningCard: {
    backgroundColor: colors.warning.light,
    borderColor: colors.warning.main,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning.dark,
    marginLeft: spacing.sm,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning.dark,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});

export default BulkImportScreen;
