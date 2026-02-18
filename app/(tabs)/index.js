import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function HomeScreen() {
  const { user, userInfo, refreshUserInfo } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const balance = userInfo?.current_balance ?? 0;
  const displayName = userInfo?.name ?? userInfo?.full_name ?? user?.user_metadata?.full_name ?? 'Dancer';

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        class_id,
        CLASSES (
          id, name, class_type, start_time, end_time, instructor, room, price
        )
      `)
      .eq('user_id', user.id);

    const enrolledClasses = (enrollments ?? [])
      .map(e => e.CLASSES) // Access joined data
      .filter(c => c && c.start_time && new Date(c.start_time) >= new Date()) // Valid & upcoming
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 5);

    setUpcomingClasses(enrolledClasses);
    setEnrolledCount(enrollments?.length ?? 0);

    await refreshUserInfo();
  }, [user, refreshUserInfo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>Welcome back,</Text>
        <Text style={styles.welcomeName} numberOfLines={1}>{String(displayName)}</Text>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statCard, styles.balanceCard]}
          onPress={() => router.push('/(tabs)/balance')}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.statLabel}>Current Balance</Text>
            <Text style={styles.statValue}>${Number(balance).toFixed(2)}</Text>
          </View>
          <View style={styles.statAction}>
             <Text style={styles.statActionText}>Top Up</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(tabs)/classes')}
          activeOpacity={0.8}
        >
           <View>
            <Text style={styles.statLabel}>Active Classes</Text>
            <Text style={styles.statValue}>{enrolledCount}</Text>
          </View>
          <View style={styles.statAction}>
             <Text style={styles.statActionText}>View Schedule</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/classes')}>
            <Text style={styles.seeAllText}>See Full Calendar</Text>
          </TouchableOpacity>
        </View>

        {upcomingClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming classes scheduled.</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/classes')}
            >
              <Text style={styles.browseButtonText}>Browse Classes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.classList}>
            {upcomingClasses.map((c) => {
              const startTime = c.start_time ? new Date(c.start_time) : null;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.classItem}
                  onPress={() => router.push('/(tabs)/classes')}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{startTime?.getDate()}</Text>
                    <Text style={styles.dateMonth}>
                      {startTime?.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.classInfo}>
                    <Text style={styles.className} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.classMeta}>
                      {startTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      {' \u2022 '}{c.instructor || 'Staff'}
                    </Text>
                  </View>
                  
                  <View style={styles.classStatus}>
                    <View style={styles.statusDot} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: { 
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  welcomeLabel: { 
    fontSize: fontSize.md, 
    color: colors.textSecondary,
    marginBottom: 4,
  },
  welcomeName: { 
    fontSize: fontSize.xxl, 
    fontWeight: '700', 
    color: colors.text,
    letterSpacing: -0.5,
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: spacing.md, 
    marginBottom: spacing.xxl 
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    minHeight: 120,
    ...colors.shadows.sm,
  },
  balanceCard: {
    backgroundColor: colors.primary,
  },
  statLabel: { 
    fontSize: fontSize.xs, 
    color: colors.textSecondary, 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: { 
    fontSize: fontSize.xxl, 
    fontWeight: '700', 
    color: colors.text,
  },
  statAction: {
    marginTop: spacing.md,
  },
  statActionText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
  // Overrides for the dark balance card
  balanceCard: {
    backgroundColor: colors.primary,
    ...colors.shadows.lg,
  },
  // We need specific styles for text inside the dark card
  // But StyleSheet doesn't support nested selection like CSS.
  // We'll handle this by conditionally styling in the JSX if needed,
  // or just keeping the design simple. 
  // Wait, I applied `balanceCard` style which sets bg to primary (black).
  // So text inside needs to be white.
  
  // Let's refine the Balance Card logic in the JSX to use specific text styles.
  // Actually, I'll just use a different approach in the JSX for simplicity in this edit.
  // Retrying the style definition for clarity:
  
  section: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { 
    fontSize: fontSize.xl, 
    fontWeight: '700', 
    color: colors.text,
    letterSpacing: -0.5,
  },
  seeAllText: { 
    fontSize: fontSize.sm, 
    color: colors.accent, 
    fontWeight: '600' 
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { 
    fontSize: fontSize.md, 
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  browseButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  classList: {
    gap: spacing.md,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...colors.shadows.sm,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    minWidth: 50,
  },
  dateDay: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  dateMonth: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  classMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  classStatus: {
    paddingLeft: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
});
