import { Modal, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontFamily } from '../constants/theme';
import { Button } from './Button';

export function StudioModal({ studio, onClose }) {
  if (!studio) return null;

  return (
    <Modal transparent animationType="fade" visible={!!studio} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{studio.name}</Text>
              <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => [styles.closeIconBtn, pressed && { opacity: 0.85 }]}>
                <Text style={styles.close}>{'\u2715'}</Text>
              </Pressable>
            </View>

            {studio.address && <DetailRow label="Address" value={studio.address} />}
            {studio.notes && <DetailRow label="Notes" value={studio.notes} />}

            <Button title="Open in Maps (Coming Soon)" variant="outline" onPress={() => {}} />
          </ScrollView>
        </Pressable>
      </Pressable>
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
    fontFamily: fontFamily.headingBold,
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
    fontFamily: fontFamily.bodySemiBold,
  },
  detailRow: {
    gap: 4,
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.text,
  },
});

