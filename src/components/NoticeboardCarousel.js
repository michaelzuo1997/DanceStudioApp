import React, { useCallback, useRef, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { NoticeboardCardV2, CARD_WIDTH } from './NoticeboardCardV2';
import { colors, spacing } from '../constants/theme';

const GAP = spacing.md;
const SNAP_INTERVAL = CARD_WIDTH + GAP;

export function NoticeboardCarousel({ notices, onPressNotice }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (!notices || notices.length === 0) return null;

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <NoticeboardCardV2 notice={item} onPress={onPressNotice} />
    </View>
  );

  return (
    <View testID="noticeboard-carousel">
      <FlatList
        ref={flatListRef}
        data={notices}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {notices.length > 1 && (
        <View style={styles.dots} testID="carousel-dots">
          {notices.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginRight: GAP,
  },
  listContent: {
    paddingHorizontal: spacing.xs,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
});
