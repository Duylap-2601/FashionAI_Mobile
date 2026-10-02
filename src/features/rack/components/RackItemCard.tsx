import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { formatProductPrice, getProductMainImage } from '@/features/products/utils/product-display';
import type { IRackItem } from '../types/rack';

interface RackItemCardProps {
  item: IRackItem;
  removing: boolean;
  onOpen: (productId: string) => void;
  onRemove: (rackItemId: string) => void;
}

export function RackItemCard({
  item,
  removing,
  onOpen,
  onRemove,
}: RackItemCardProps) {
  const { product } = item;
  const imageUrl = getProductMainImage(product);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = imageUrl !== null && failedImageUrl === imageUrl;

  return (
    <View className="mx-lg flex-row overflow-hidden rounded-xl border border-surface-line bg-surface-lowest">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở sản phẩm ${product.name}`}
        className="flex-1 flex-row active:opacity-70"
        onPress={() => onOpen(item.productId)}
      >
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            transition={150}
            className="h-32 w-24 bg-surface-low"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <View className="h-32 w-24 items-center justify-center bg-surface-low">
            <Text className="text-headline-lg text-outline">◇</Text>
            <Text className="mt-xs text-body-sm text-on-surface-variant">Chưa có ảnh</Text>
          </View>
        )}

        <View className="flex-1 justify-between p-md">
          <View>
            {product.brand ? (
              <Text className="text-label-md uppercase text-on-surface-variant" numberOfLines={1}>
                {product.brand}
              </Text>
            ) : null}
            <Text className="mt-xs text-label-lg text-on-surface" numberOfLines={2}>
              {product.name}
            </Text>
            {product.status !== 'ACTIVE' ? (
              <Text className="mt-xs text-body-sm text-danger">Hiện không khả dụng</Text>
            ) : null}
          </View>
          <Text className="text-price-sm text-primary-container">
            {formatProductPrice(product.price)}
          </Text>
        </View>
      </Pressable>

      <View className="justify-end p-sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa ${product.name} khỏi Tủ đồ`}
          disabled={removing}
          className="min-h-11 min-w-11 items-center justify-center rounded-full active:bg-surface-low disabled:opacity-50"
          onPress={() => onRemove(item.id)}
        >
          <Text className="text-label-lg text-danger">{removing ? '…' : 'Xóa'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
