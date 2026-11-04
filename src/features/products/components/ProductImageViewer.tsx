import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import type {
  LayoutChangeEvent,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS, SPACING } from '@/constants/theme';
import { getPageIndex } from '../utils/image-zoom';
import type { ZoomSize } from '../utils/image-zoom';
import { ZoomableImage } from './ZoomableImage';

interface ProductImageViewerProps {
  imageUrls: string[];
  initialIndex: number;
  productName: string;
  /** Called with the image the user was looking at when closing. */
  onClose: (lastIndex: number) => void;
}

const navButtonStyle = tva({
  base: 'h-11 w-11 items-center justify-center border border-landing-paper/20',
  variants: {
    disabled: {
      true: 'opacity-30',
      false: 'active:border-brass',
    },
  },
});

/**
 * Full-screen gallery opened from the product detail images: swipe between
 * images, pinch or double tap to zoom. Paging is locked while an image is
 * zoomed so dragging the image never turns the page.
 */
export function ProductImageViewer({
  imageUrls,
  initialIndex,
  productName,
  onClose,
}: ProductImageViewerProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const imageCount = imageUrls.length;
  const startIndex = Math.max(0, Math.min(initialIndex, imageCount - 1));
  const [index, setIndex] = useState(startIndex);
  const indexRef = useRef(startIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [viewport, setViewport] = useState<ZoomSize | null>(null);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(
    () => new Set(),
  );

  const showIndex = useCallback((nextIndex: number) => {
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setIsZoomed(false);
  }, []);

  const handleClose = useCallback(() => {
    onClose(indexRef.current);
  }, [onClose]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((current) =>
      current && current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!viewport) return;
      const nextIndex = getPageIndex(
        event.nativeEvent.contentOffset.x,
        viewport.width,
        imageCount,
      );
      if (nextIndex !== indexRef.current) {
        showIndex(nextIndex);
      }
    },
    [imageCount, showIndex, viewport],
  );

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= imageCount) return;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      showIndex(nextIndex);
    },
    [imageCount, showIndex],
  );

  const handleZoomChange = useCallback((itemIndex: number, zoomed: boolean) => {
    if (itemIndex === indexRef.current) {
      setIsZoomed(zoomed);
    }
  }, []);

  const handleImageError = useCallback((itemIndex: number) => {
    setFailedIndexes((current) =>
      current.has(itemIndex) ? current : new Set(current).add(itemIndex),
    );
  }, []);

  const renderItem = useCallback(
    ({ item: imageUrl, index: itemIndex }: ListRenderItemInfo<string>) => {
      if (!viewport) return null;
      const label = `${productName}, ảnh ${itemIndex + 1} trên ${imageCount}`;
      return (
        <View
          className="items-center justify-center overflow-hidden"
          style={{ width: viewport.width, height: viewport.height }}
        >
          {failedIndexes.has(itemIndex) ? (
            <View
              accessible
              accessibilityLabel={`Không thể hiển thị ảnh ${itemIndex + 1} của ${productName}`}
              className="items-center"
            >
              <Text className="font-sans text-body-md text-landing-paper/60">
                Không thể hiển thị ảnh
              </Text>
            </View>
          ) : (
            <ZoomableImage
              uri={imageUrl}
              width={viewport.width}
              height={viewport.height}
              accessibilityLabel={label}
              active={itemIndex === index}
              onZoomChange={(zoomed) => handleZoomChange(itemIndex, zoomed)}
              onError={() => handleImageError(itemIndex)}
            />
          )}
        </View>
      );
    },
    [
      failedIndexes,
      handleImageError,
      handleZoomChange,
      imageCount,
      index,
      productName,
      viewport,
    ],
  );

  const hasManyImages = imageCount > 1;
  const isFirst = index <= 0;
  const isLast = index >= imageCount - 1;

  return (
    <Modal
      visible
      animationType="fade"
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      onRequestClose={handleClose}
    >
      <StatusBar style="light" />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={handleClose}
        className="flex-1 bg-obsidian"
      >
        <View
          className="flex-row items-center gap-md border-b border-landing-paper/15 px-lg pb-sm"
          style={{ paddingTop: insets.top + SPACING.sm }}
        >
          <View className="flex-1">
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
              Thư viện ảnh
            </Text>
            <Text
              numberOfLines={1}
              accessibilityRole="header"
              className="mt-xs font-display text-headline-sm text-landing-paper"
            >
              {productName}
            </Text>
          </View>
          <View
            accessible
            accessibilityLabel={`Ảnh ${index + 1} trên ${imageCount}`}
            className="border border-landing-paper/15 px-sm py-xs"
          >
            <Text className="font-mono text-[10px] tabular-nums text-landing-paper/70">
              {index + 1} / {imageCount}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng thư viện ảnh"
            onPress={handleClose}
            className="h-11 w-11 items-center justify-center border border-landing-paper/15 active:border-brass"
          >
            <X size={20} strokeWidth={1.75} color={COLORS.paper} />
          </Pressable>
        </View>

        <View className="flex-1" onLayout={handleLayout}>
          {viewport ? (
            <FlatList
              ref={listRef}
              data={imageUrls}
              horizontal
              pagingEnabled
              scrollEnabled={!isZoomed}
              // Cells are memoised; re-render them whenever renderItem's inputs change.
              extraData={renderItem}
              keyExtractor={(imageUrl, itemIndex) => `${itemIndex}:${imageUrl}`}
              renderItem={renderItem}
              initialScrollIndex={startIndex > 0 ? startIndex : undefined}
              getItemLayout={(_, itemIndex) => ({
                length: viewport.width,
                offset: viewport.width * itemIndex,
                index: itemIndex,
              })}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
            />
          ) : null}
        </View>

        <View
          className="flex-row items-center gap-md border-t border-landing-paper/15 px-lg pt-sm"
          style={{ paddingBottom: insets.bottom + SPACING.sm }}
        >
          {hasManyImages ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ảnh trước"
              accessibilityState={{ disabled: isFirst }}
              disabled={isFirst}
              onPress={() => goToIndex(index - 1)}
              className={navButtonStyle({ disabled: isFirst })}
            >
              <ChevronLeft size={20} strokeWidth={1.75} color={COLORS.paper} />
            </Pressable>
          ) : null}
          <Text
            accessibilityLiveRegion="polite"
            className="flex-1 text-center font-sans text-body-sm text-landing-paper/70"
          >
            {isZoomed
              ? 'Chạm hai lần để thu nhỏ'
              : 'Chụm hai ngón hoặc chạm hai lần để phóng to'}
          </Text>
          {hasManyImages ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ảnh tiếp theo"
              accessibilityState={{ disabled: isLast }}
              disabled={isLast}
              onPress={() => goToIndex(index + 1)}
              className={navButtonStyle({ disabled: isLast })}
            >
              <ChevronRight size={20} strokeWidth={1.75} color={COLORS.paper} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
