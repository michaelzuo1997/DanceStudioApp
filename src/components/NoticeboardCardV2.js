import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const CARD_WIDTH = SCREEN_WIDTH - 64;
const ASPECT_RATIO = 5 / 4; // height = width * 5/4 (portrait poster)

export function NoticeboardCardV2({ notice, onPress }) {
  const { locale } = useLanguage();

  if (!notice) return null;

  const title = locale === 'zh' ? notice.title_zh : notice.title_en;
  const body = locale === 'zh' ? notice.body_zh : notice.body_en;
  const hasImage = !!notice.image_url;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      onPress={() => onPress?.(notice)}
      testID={`noticeboard-card-${notice.id}`}
    >
      {hasImage ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: notice.image_url }}
            style={styles.image}
            resizeMode="cover"
            testID={`noticeboard-image-${notice.id}`}
          />
          <View style={styles.glassStrip}>
            <Text style={styles.glassTitle} numberOfLines={1}>{title}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {body ? (
            <Text style={styles.body} numberOfLines={3}>{body}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...colors.shadows.md,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * ASPECT_RATIO,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  glassStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(251,248,245,0.85)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  glassTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  textContainer: {
    padding: spacing.md,
    minHeight: 120,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
