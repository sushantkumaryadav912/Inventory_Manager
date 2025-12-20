// src/components/ui/DatePicker.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { formatDate } from '../../utils/formatters';

const DatePicker = ({
  label,
  value,
  onChange,
  mode = 'date', // date, time, datetime
  error,
  disabled = false,
  minimumDate,
  maximumDate,
  placeholder = 'Select date',
  style,
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };

  const displayValue = value ? formatDate(value, 'short') : null;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.triggerText,
          !displayValue && styles.placeholderText,
        ]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.gray[500]}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
});

export default DatePicker;
