import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, spacing, fontSize, borderRadius, fontFamily } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_WIDTH = SCREEN_WIDTH - 48;

export function NoticeboardExpandModal({ visible, notice, notices, onClose }) {
  const { t, locale } = useLanguage();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const initialIndex = notice && notices
    ? notices.findIndex((n) => n.id === notice.id)
    : 0;

  const handleLayout = () => {
    if (initialIndex > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
      setCurrentIndex(initialIndex);
    }
  };

  const onViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderNotice = ({ item }) => {
    const title = locale === 'zh' ? item.title_zh : item.title_en;
    const body = locale === 'zh' ? item.body_zh : item.body_en;
    const hasImage = !!item.image_url;

    return (
      <ScrollView
        style={styles.noticeScroll}
        contentContainerStyle={styles.noticeContent}
        showsVerticalScrollIndicator={false}
      >
        {hasImage && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.expandedImage}
            resizeMode="contain"
            testID={`expand-image-${item.id}`}
          />
        )}
        <Text style={styles.expandedTitle}>{title}</Text>
        {body ? <Text style={styles.expandedBody}>{body}</Text> : null}
        {item.link_url ? (
          <Pressable
            onPress={() => Linking.openURL(item.link_url).catch(() => {})}
            style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.linkText}>{t('noticeboard.readMore')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  };

  const data = notices && notices.length > 0 ? notices : (notice ? [notice] : []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
            onPress={onClose}
            testID="expand-modal-close"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <FlatList
            ref={flatListRef}
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderNotice}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={handleLayout}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: MODAL_WIDTH,
              offset: MODAL_WIDTH * index,
              index,
            })}
          />

          {data.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {data.length}
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  modalContainer: {
    width: MODAL_WIDTH,
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  noticeScroll: {
    width: MODAL_WIDTH,
  },
  noticeContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  expandedImage: {
    width: '100%',
    height: MODAL_WIDTH * 1.2,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  expandedTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.headingSemiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  expandedBody: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.white,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
  },
  counter: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  counterText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
});
