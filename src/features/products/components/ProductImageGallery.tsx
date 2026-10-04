import React, { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';

interface ProductImageGalleryProps {
  imageUrls: string[];
  productName: string;
}

const MAX_IMAGE_WIDTH = 420;

export function ProductImageGallery({
  imageUrls,
  productName,
}: ProductImageGalleryProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const imageWidth = Math.min(screenWidth, MAX_IMAGE_WIDTH);
  const imageHeight = imageWidth / 0.75;

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / screenWidth,
      );
      setActiveIndex(Math.max(0, Math.min(nextIndex, imageUrls.length - 1)));
    },
    [imageUrls.length, screenWidth],
  );

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImageUrls((currentUrls) => {
      const nextUrls = new Set(currentUrls);
      nextUrls.add(imageUrl);
      return nextUrls;
    });
  }, []);

  if (imageUrls.length === 0) {
    return (
      <View
        accessibilityLabel={`${productName}, chưa có ảnh sản phẩm`}
        style={[styles.emptyMedia, { width: imageWidth, height: imageHeight }]}
      >
        <Text style={styles.placeholderMark}>◇</Text>
        <Text style={styles.placeholderText}>Chưa có ảnh sản phẩm</Text>
      </View>
    );
  }

  return (
    <View accessibilityLabel={`Thư viện ảnh của ${productName}`}>
      <FlatList
        data={imageUrls}
        horizontal
        pagingEnabled
        keyExtractor={(imageUrl) => imageUrl}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item: imageUrl, index }) => (
          <View style={[styles.slide, { width: screenWidth }]}>
            {failedImageUrls.has(imageUrl) ? (
              <View
                accessibilityLabel={`Không thể hiển thị ảnh ${index + 1} của ${productName}`}
                style={[
                  styles.emptyMedia,
                  { width: imageWidth, height: imageHeight },
                ]}
              >
                <Text style={styles.placeholderMark}>◇</Text>
                <Text style={styles.placeholderText}>Không thể hiển thị ảnh</Text>
              </View>
            ) : (
              <Image
                accessibilityLabel={`${productName}, ảnh ${index + 1}`}
                source={{ uri: imageUrl }}
                contentFit="cover"
                transition={150}
                style={{ width: imageWidth, height: imageHeight }}
                onError={() => handleImageError(imageUrl)}
              />
            )}
          </View>
        )}
      />

      {imageUrls.length > 1 ? (
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>
            {activeIndex + 1} / {imageUrls.length}
          </Text>
          <View style={styles.dots}>
            {imageUrls.map((imageUrl, index) => (
              <View
                key={imageUrl}
                style={[styles.dot, index === activeIndex && styles.activeDot]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLow,
  },
  emptyMedia: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceLow,
  },
  placeholderMark: {
    fontSize: FONT_SIZE.display,
    color: COLORS.outline,
  },
  placeholderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
  },
  pagination: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceLowest,
  },
  paginationText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  dots: {
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    overflow: 'hidden',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.outlineVariant,
  },
  activeDot: {
    width: 18,
    backgroundColor: COLORS.primaryContainer,
  },
});
