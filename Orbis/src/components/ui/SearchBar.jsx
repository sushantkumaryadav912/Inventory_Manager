// src/components/ui/SearchBar.jsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  autoFocus = false,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={colors.gray[500]}
        style={styles.searchIcon}
      />
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...props}
      />

      {value?.length > 0 && (
        <TouchableOpacity
          onPress={onClear || (() => onChangeText(''))}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.gray[500]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
});

export default SearchBar;
