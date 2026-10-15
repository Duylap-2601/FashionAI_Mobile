import React, { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { SPACING } from '@/constants/theme';

interface ProductImageGalleryProps {
  imageUrls: string[];
  productName: string;
}

const MAX_IMAGE_WIDTH = 420;
const dotStyle = tva({
  base: 'h-1.5 rounded-full',
  variants: {
    active: {
      true: 'w-4 bg-primary-container',
      false: 'w-1.5 bg-surface-line',
    },
  },
});

export function ProductImageGallery({
  imageUrls,
  productName,
}: ProductImageGalleryProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const imageWidth = Math.max(
    1,
    Math.min(screenWidth - SPACING.lg * 2, MAX_IMAGE_WIDTH),
  );
  const imageHeight = imageWidth / 0.75;

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / imageWidth,
      );
      setActiveIndex(Math.max(0, Math.min(nextIndex, imageUrls.length - 1)));
    },
    [imageUrls.length, imageWidth],
  );

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImageUrls((currentUrls) => new Set(currentUrls).add(imageUrl));
  }, []);

  return (
    <View
      accessibilityLabel={`Thư viện ảnh của ${productName}`}
      className="items-center px-lg pt-lg"
    >
      <View style={{ width: imageWidth }}>
        <View className="overflow-hidden rounded-catalog-gallery bg-catalog-muted">
          {imageUrls.length === 0 ? (
            <View style={{ height: imageHeight }}>
              <View
                accessibilityLabel={`${productName}, chưa có ảnh sản phẩm`}
                className="flex-1 items-center justify-center gap-sm"
              >
                <Text className="font-sans text-display text-catalog-muted-text">
                  ◇
                </Text>
                <Text className="font-sans text-body-md text-catalog-muted-text">
                  Chưa có ảnh sản phẩm
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={imageUrls}
              horizontal
              pagingEnabled
              keyExtractor={(imageUrl) => imageUrl}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              renderItem={({ item: imageUrl, index }) => (
                <View style={{ width: imageWidth, height: imageHeight }}>
                  {failedImageUrls.has(imageUrl) ? (
                    <View
                      accessibilityLabel={`Không thể hiển thị ảnh ${index + 1} của ${productName}`}
                      className="flex-1 items-center justify-center gap-sm"
                    >
                      <Text className="font-sans text-display text-catalog-muted-text">
                        ◇
                      </Text>
                      <Text className="font-sans text-body-md text-catalog-muted-text">
                        Không thể hiển thị ảnh
                      </Text>
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
          )}
          {imageUrls.length > 1 ? (
            <View
              pointerEvents="none"
              className="absolute bottom-md right-md rounded-full bg-surface-lowest/90 px-md py-xs"
            >
              <Text className="font-sans text-label-md tabular-nums text-primary-container">
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
    </View>
  );
}
