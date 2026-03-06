import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export function InstructorPicker({ instructors, selectedId, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.row}>
        {/* None option */}
        <TouchableOpacity
          style={[styles.chip, !selectedId && styles.chipActive]}
          onPress={() => onSelect('')}
        >
          <Text style={[styles.chipText, !selectedId && styles.chipTextActive]}>—</Text>
        </TouchableOpacity>

        {instructors.map((inst) => (
          <TouchableOpacity
            key={inst.id}
            style={[styles.chip, selectedId === inst.id && styles.chipActive]}
            onPress={() => onSelect(inst.id)}
          >
            <Text style={[styles.chipText, selectedId === inst.id && styles.chipTextActive]}>
              {inst.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
  },
});
