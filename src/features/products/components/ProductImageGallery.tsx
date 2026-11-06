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
const dotStyle = tva({
  base: 'h-1.5 rounded-full',
  variants: {
    active: {
      true: 'w-4 bg-oxblood',
      false: 'w-1.5 bg-taupe',
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
        <View className="overflow-hidden rounded-subtle bg-ivory">
          {imageUrls.length === 0 ? (
            <View style={{ height: imageHeight }}>
              <View
                accessibilityLabel={`${productName}, chưa có ảnh sản phẩm`}
                className="flex-1 items-center justify-center gap-sm"
              >
                <Text className="font-sans text-display text-landing-muted">
                  ◇
                </Text>
                <Text className="font-sans text-body-md text-landing-muted">
                  Chưa có ảnh sản phẩm
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
                      className="flex-1 items-center justify-center gap-sm"
                    >
                      <Text className="font-sans text-display text-landing-muted">
                        ◇
                      </Text>
                      <Text className="font-sans text-body-md text-landing-muted">
                        Không thể hiển thị ảnh
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: imageUrl }}
                      contentFit="cover"
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
              className="absolute right-md top-md min-h-11 flex-row items-center gap-xs rounded-subtle border border-landing-line bg-paper/95 px-md active:border-oxblood"
            >
              <Maximize2 size={14} strokeWidth={1.75} color={COLORS.obsidian} />
              <Text className="font-sans text-2xs font-semibold uppercase tracking-widest text-obsidian">
                Phóng to
              </Text>
            </Pressable>
          ) : null}
          {imageUrls.length > 1 ? (
            <View
              pointerEvents="none"
              className="absolute bottom-md right-md rounded-subtle border border-landing-line bg-ivory/90 px-md py-xs"
            >
              <Text className="font-mono text-label-md tabular-nums text-obsidian">
                {activeIndex + 1} / {imageUrls.length}
              </Text>
            </View>
          ) : null}
        </View>
        {imageUrls.length > 1 ? (
          <View className="min-h-11 flex-row items-center justify-center gap-xs overflow-hidden">
            {imageUrls.map((imageUrl, index) => (
              <View
                key={imageUrl}
                className={dotStyle({ active: index === activeIndex })}
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
