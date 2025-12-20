// src/components/ui/Dropdown.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

const Dropdown = ({
  label,
  value,
  items = [],
  onSelect,
  placeholder = 'Select...',
  error,
  disabled = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find(item => item.value === value);

  const handleSelect = (item) => {
    onSelect(item.value);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.triggerText,
          !selectedItem && styles.placeholderText,
        ]}>
          {selectedItem?.label || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.gray[500]}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.value === value && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[
                    styles.itemText,
                    item.value === value && styles.itemTextSelected,
                  ]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary[600]}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  triggerError: {
    borderColor: colors.error.main,
  },
  triggerDisabled: {
    backgroundColor: colors.gray[100],
    opacity: 0.6,
  },
  triggerText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.gray[400],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error.main,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    maxHeight: 400,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemSelected: {
    backgroundColor: colors.primary[50],
  },
  itemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  itemTextSelected: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  },
});

export default Dropdown;
    