import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../constants/theme';
import { Button } from './Button';

export function StudioModal({ studio, onClose }) {
  if (!studio) return null;

  return (
    <Modal transparent animationType="fade" visible={!!studio} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modal} activeOpacity={1} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{studio.name}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeIconBtn}>
                <Text style={styles.close}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            {studio.address && <DetailRow label="Address" value={studio.address} />}
            {studio.notes && <DetailRow label="Notes" value={studio.notes} />}

            <Button title="Open in Maps (Coming Soon)" variant="outline" onPress={() => {}} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  detailRow: {
    gap: 4,
    marginBottom: spacing.md,
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
});

