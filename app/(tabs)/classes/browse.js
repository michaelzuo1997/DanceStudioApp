import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { useCart } from '../../../src/context/CartContext';
import { supabase } from '../../../src/lib/supabase';
import { ClassCard } from '../../../src/components/ClassCard';
import { ClassDetailModal } from '../../../src/components/ClassDetailModal';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

export default function BrowseScreen() {
  const { user } = useAuth();
  const { items: cartItems, addItem } = useCart();
  const [classes, setClasses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [selectedType, setSelectedType] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('CLASSES')
      .select('id, class_id, name, duration_name, class_type, start_time, end_time, instructor, room, price, cost')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(100);
    setClasses(data ?? []);

    if (user) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('user_id', user.id);
      setEnrolledIds(new Set((enrollments ?? []).map((e) => String(e.class_id))));
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const cartIds = new Set(cartItems.map((i) => i.id));

  const classTypes = [...new Set(classes.map((c) => c.class_type?.trim() || 'Other'))].sort();
  const classesByType = {};
  for (const c of classes) {
    const type = c.class_type?.trim() || 'Other';
    if (!classesByType[type]) classesByType[type] = [];
    classesByType[type].push(c);
  }

  const classesForType = selectedType ? classesByType[selectedType] ?? [] : [];

  const toCartClass = (c) => ({
    id: String(c.id ?? c.class_id),
    name: String(c.name || c.duration_name || c.class_type || 'Class'),
    class_type: c.class_type || undefined,
    start_time: c.start_time,
    end_time: c.end_time,
    instructor: c.instructor || undefined,
    room: c.room || undefined,
    price: Number(c.price ?? c.cost ?? 0),
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.heading}>Browse & Enrol</Text>
        <Text style={styles.subheading}>Choose a class type to see available sessions.</Text>

        <View style={styles.typeGrid}>
          {classTypes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No class types available yet.</Text>
            </View>
          ) : (
            classTypes.map((type) => {
              const count = classesByType[type]?.length ?? 0;
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                  onPress={() => setSelectedType((prev) => prev === type ? null : type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeName, isSelected && styles.typeNameSelected]}>
                    {type}
                  </Text>
                  <Text style={[styles.typeCount, isSelected && styles.typeCountSelected]}>
                    {count} class{count !== 1 ? 'es' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {selectedType && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{selectedType} classes</Text>
              <TouchableOpacity onPress={() => setSelectedType(null)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {classesForType.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming classes for this type.</Text>
            ) : (
              classesForType.map((c) => (
                <ClassCard
                  key={c.id ?? c.class_id}
                  classData={toCartClass(c)}
                  enrolled={enrolledIds.has(String(c.id ?? c.class_id))}
                  inCart={cartIds.has(String(c.id ?? c.class_id))}
                  onPress={() => setSelectedClass(toCartClass(c))}
                  onAddToCart={(item) => addItem(item)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {selectedClass && (
        <ClassDetailModal
          classData={selectedClass}
          enrolledIds={enrolledIds}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  heading: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subheading: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    padding: spacing.xl,
  },
  typeCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  typeNameSelected: { color: colors.white },
  typeCount: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  typeCountSelected: { color: 'rgba(255,255,255,0.7)' },
  section: { marginTop: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  clearText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '500' },
  emptyCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...colors.shadows.soft,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
});
