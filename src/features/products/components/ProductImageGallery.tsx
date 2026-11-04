import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Maximize2 } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS, SPACING } from '@/constants/theme';
import { getPageIndex } from '../utils/image-zoom';
import { ProductImageViewer } from './ProductImageViewer';

interface ProductImageGalleryProps {
  imageUrls: string[];
  focusImageUrl?: string | null;
  productName: string;
}

const MAX_IMAGE_WIDTH = 420;
// Hairline page indicators (design/DESIGN.md › Product Detail), not round dots.
const indicatorStyle = tva({
  base: 'h-0.5',
  variants: {
    active: {
      true: 'w-6 bg-oxblood',
      false: 'w-3 bg-taupe',
    },
  },
});

export function ProductImageGallery({
  imageUrls,
  focusImageUrl,
  productName,
}: ProductImageGalleryProps) {
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const lastFocusedImageRef = useRef<string | null>(null);
  const focusIndex = focusImageUrl ? imageUrls.indexOf(focusImageUrl) : -1;
  const initialFocusIndex =
    focusIndex >= 0 ? Math.min(focusIndex, imageUrls.length - 1) : 0;
  const [activeIndex, setActiveIndex] = useState(initialFocusIndex);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const imageWidth = Math.max(
    1,
    Math.min(screenWidth - SPACING.lg * 2, MAX_IMAGE_WIDTH),
  );
  const imageHeight = imageWidth / 0.75;

  useEffect(() => {
    const targetUrl = focusImageUrl?.trim();
    if (!targetUrl || targetUrl === lastFocusedImageRef.current) {
      return;
    }

    const targetIndex = imageUrls.indexOf(targetUrl);
    if (targetIndex < 0) {
      return;
    }

    lastFocusedImageRef.current = targetUrl;
    requestAnimationFrame(() => {
      setActiveIndex(targetIndex);
      listRef.current?.scrollToOffset({
        offset: targetIndex * imageWidth,
        animated: true,
      });
    });
  }, [focusImageUrl, imageUrls, imageWidth]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActiveIndex(
        getPageIndex(
          event.nativeEvent.contentOffset.x,
          imageWidth,
          imageUrls.length,
        ),
      );
    },
    [imageUrls.length, imageWidth],
  );

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImageUrls((currentUrls) => new Set(currentUrls).add(imageUrl));
  }, []);

  // Keep the inline gallery on the image the user last looked at full screen.
  const handleViewerClose = useCallback(
    (lastIndex: number) => {
      setViewerIndex(null);
      setActiveIndex(lastIndex);
      listRef.current?.scrollToOffset({
        offset: lastIndex * imageWidth,
        animated: false,
      });
    },
    [imageWidth],
  );

  return (
    <View
      accessibilityLabel={`Thư viện ảnh của ${productName}`}
      className="items-center px-lg pt-lg"
    >
      <View style={{ width: imageWidth }}>
        <View className="overflow-hidden rounded-subtle border border-landing-line bg-ivory">
          {imageUrls.length === 0 ? (
            <View style={{ height: imageHeight }}>
              <View
                accessibilityLabel={`${productName}, chưa có ảnh sản phẩm`}
                className="flex-1 items-center justify-center"
              >
                <Text className="font-sans text-body-sm text-landing-muted">
                  Chưa có ảnh
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={imageUrls}
              horizontal
              pagingEnabled
              keyExtractor={(imageUrl) => imageUrl}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={
                initialFocusIndex > 0 ? initialFocusIndex : undefined
              }
              getItemLayout={(_, index) => ({
                length: imageWidth,
                offset: imageWidth * index,
                index,
              })}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              renderItem={({ item: imageUrl, index }) => (
                <Pressable
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${productName}, ảnh ${index + 1}`}
                  accessibilityHint="Mở ảnh toàn màn hình để phóng to"
                  onPress={() => setViewerIndex(index)}
                  style={{ width: imageWidth, height: imageHeight }}
                >
                  {failedImageUrls.has(imageUrl) ? (
                    <View
                      accessibilityLabel={`Không thể hiển thị ảnh ${index + 1} của ${productName}`}
                      className="flex-1 items-center justify-center"
                    >
                      <Text className="font-sans text-body-sm text-landing-muted">
                        Không thể hiển thị ảnh
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: imageUrl }}
                      contentFit="cover"
                      contentPosition="top"
                      transition={150}
                      style={{ width: imageWidth, height: imageHeight }}
                      onError={() => handleImageError(imageUrl)}
                    />
                  )}
                </Pressable>
              )}
            />
          )}
          {imageUrls.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Phóng to ảnh"
              onPress={() => setViewerIndex(activeIndex)}
              className="absolute right-md top-md min-h-11 flex-row items-center gap-sm border border-landing-line bg-landing-paper/95 px-md active:border-oxblood"
            >
              <Maximize2 size={14} strokeWidth={1.75} color={COLORS.obsidian} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                Phóng to
              </Text>
            </Pressable>
          ) : null}
          {imageUrls.length > 1 ? (
            <View
              pointerEvents="none"
              className="absolute bottom-md right-md border border-landing-line bg-landing-paper/95 px-2.5 py-1"
            >
              <Text className="font-mono text-[10px] font-medium tabular-nums text-landing-obsidian">
                {activeIndex + 1} / {imageUrls.length}
              </Text>
            </View>
          ) : null}
        </View>
        {imageUrls.length > 1 ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="min-h-11 flex-row items-center justify-center gap-1.5 overflow-hidden"
          >
            {imageUrls.map((imageUrl, index) => (
              <View
                key={imageUrl}
                className={indicatorStyle({ active: index === activeIndex })}
              />
            ))}
          </View>
        ) : null}
      </View>
      {viewerIndex !== null ? (
        <ProductImageViewer
          imageUrls={imageUrls}
          initialIndex={viewerIndex}
          productName={productName}
          onClose={handleViewerClose}
        />
      ) : null}
    </View>
  );
}
