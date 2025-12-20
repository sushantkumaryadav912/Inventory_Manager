// src/components/domain/inventory/CategoryBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../../theme';

const CategoryBadge = ({ category, style }) => {
  if (!category) return null;

  // Generate consistent color based on category name
  const getCategoryColor = (name) => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const categoryColor = getCategoryColor(category);

  return (
    <View style={[styles.badge, { backgroundColor: `${categoryColor}20` }, style]}>
      <Text style={[styles.text, { color: categoryColor }]}>
        {category}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default CategoryBadge;
