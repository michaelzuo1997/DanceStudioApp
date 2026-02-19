import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../constants/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TimetableView({ schedules, onBookClass, locale = 'en' }) {
  // Group schedules by day
  const groupedByDay = {};
  schedules.forEach((item) => {
    const day = item.day_of_week;
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(item);
  });

  // Sort each day's schedules by start time
  Object.keys(groupedByDay).forEach((day) => {
    groupedByDay[day].sort((a, b) => {
      if (a.start_time < b.start_time) return -1;
      if (a.start_time > b.start_time) return 1;
      return 0;
    });
  });

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}`;
  };

  const getAudienceLabel = (audience) => {
    if (locale === 'zh') {
      return audience === 'children' ? '少儿' : '成人';
    }
    return audience === 'children' ? 'Children' : 'Adult';
  };

  if (schedules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {locale === 'zh' ? '暂无课程安排' : 'No classes scheduled'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.entries(groupedByDay).map(([day, items]) => (
        <View key={day} style={styles.daySection}>
          <Text style={styles.dayTitle}>{DAYS[day]}</Text>
          <View style={styles.scheduleList}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.scheduleItem}
                onPress={() => onBookClass?.(item)}
                activeOpacity={0.8}
              >
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
                  <Text style={styles.durationText}>{item.duration_minutes} min</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.infoColumn}>
                  <Text style={styles.instructorText}>{item.instructor}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.roomText}>{item.room}</Text>
                    {item.audience && (
                      <View style={styles.audienceBadge}>
                        <Text style={styles.audienceText}>{getAudienceLabel(item.audience)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.priceColumn}>
                  <Text style={styles.priceText}>A${Number(item.price_per_class || 0).toFixed(0)}</Text>
                  <View style={styles.bookButton}>
                    <Text style={styles.bookText}>
                      {locale === 'zh' ? '预约' : 'Book'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  emptyContainer: {
    padding: spacing.xxl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  daySection: {
    gap: spacing.sm,
  },
  dayTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scheduleList: {
    gap: spacing.sm,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...colors.shadows.sm,
  },
  timeColumn: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  durationText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  infoColumn: {
    flex: 1,
  },
  instructorText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roomText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  audienceBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  audienceText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  priceColumn: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  priceText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bookButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bookText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
});
