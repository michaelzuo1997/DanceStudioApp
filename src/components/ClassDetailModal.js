import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../constants/theme';
import { useCart } from '../context/CartContext';
import { Button } from './Button';

export function ClassDetailModal({ classData, enrolledIds, onClose }) {
  const { addItem, items } = useCart();

  if (!classData) return null;

  const isEnrolled = enrolledIds?.has?.(classData.id);
  const inCart = items.some((i) => i.id === classData.id);
  const price = classData.price ?? 0;
  const startTime = classData.start_time ? new Date(classData.start_time) : null;
  const endTime = classData.end_time ? new Date(classData.end_time) : null;

  return (
    <Modal transparent animationType="fade" visible={!!classData} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modal} activeOpacity={1} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{classData.name}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeIconBtn}>
                <Text style={styles.close}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.info}>
              {classData.class_type && (
                <DetailRow label="Type" value={classData.class_type} />
              )}
              {classData.instructor && (
                <DetailRow label="Instructor" value={classData.instructor} />
              )}
              {startTime && (
                <DetailRow
                  label="Start"
                  value={`${startTime.toLocaleDateString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric',
                  })} at ${startTime.toLocaleTimeString(undefined, {
                    hour: 'numeric', minute: '2-digit',
                  })}`}
                />
              )}
              {endTime && (
                <DetailRow
                  label="End"
                  value={`${endTime.toLocaleDateString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric',
                  })} at ${endTime.toLocaleTimeString(undefined, {
                    hour: 'numeric', minute: '2-digit',
                  })}`}
                />
              )}
              {classData.room && (
                <DetailRow label="Location" value={classData.room} />
              )}
              <DetailRow label="Price" value={`$${Number(price).toFixed(2)}`} bold />
            </View>

            <View style={styles.actions}>
              {isEnrolled ? (
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledText}>Enrolled</Text>
                </View>
              ) : inCart ? (
                <View style={styles.inCartBadge}>
                  <Text style={styles.inCartText}>In Cart</Text>
                </View>
              ) : (
                <Button
                  title="Add to Cart"
                  onPress={() => { addItem(classData); onClose(); }}
                  style={styles.addBtn}
                />
              )}
              <Button 
                title="Close" 
                variant="ghost" 
                onPress={onClose} 
              />
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function DetailRow({ label, value, bold }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, bold && styles.detailBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '80%',
    ...colors.shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
    lineHeight: 32,
  },
  closeIconBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  close: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  info: {
    gap: spacing.md,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  detailBold: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: fontSize.lg,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  enrolledBadge: {
    backgroundColor: colors.success + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  enrolledText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
  inCartBadge: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  inCartText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addBtn: {
    width: '100%',
  },
});
