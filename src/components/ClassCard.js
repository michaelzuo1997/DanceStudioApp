import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../constants/theme';
import { Button } from './Button'; // Use our new button component

export function ClassCard({ classData, enrolled = false, inCart = false, onPress, onAddToCart }) {
  const price = classData.price ?? classData.cost ?? 0;
  const startTime = classData.start_time ? new Date(classData.start_time) : null;
  const endTime = classData.end_time ? new Date(classData.end_time) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{classData.class_type || 'Class'}</Text>
          <Text style={styles.price}>${Number(price).toFixed(2)}</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>{classData.name}</Text>
        
        {classData.instructor && (
          <Text style={styles.instructor}>with {classData.instructor}</Text>
        )}

        <View style={styles.detailsContainer}>
          {startTime && (
            <View style={styles.timeContainer}>
              <Text style={styles.dateText}>
                {startTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.timeText}>
                {startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                {' - '}
                {endTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          )}
          {classData.room && (
             <Text style={styles.roomText}>{classData.room}</Text>
          )}
        </View>

        <View style={styles.footer}>
          {enrolled ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Enrolled</Text>
            </View>
          ) : inCart ? (
             <View style={[styles.statusBadge, styles.inCartBadge]}>
              <Text style={[styles.statusText, styles.inCartText]}>In Cart</Text>
            </View>
          ) : onAddToCart ? (
            <Button 
              title="Book" 
              onPress={(e) => { e.stopPropagation?.(); onAddToCart(classData); }}
              size="sm"
              variant="secondary"
              style={styles.bookButton}
            />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    // Soft shadow
    ...colors.shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight, // Very subtle border
  },
  content: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  category: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700', // Bold for impact
    color: colors.text,
    lineHeight: fontSize.xl * 1.2,
  },
  instructor: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'column',
  },
  dateText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  roomText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  footer: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: colors.success + '20', // 20% opacity
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inCartBadge: {
    backgroundColor: colors.surfaceAlt,
  },
  inCartText: {
    color: colors.textSecondary,
  },
  bookButton: {
    minWidth: 100,
  },
});
