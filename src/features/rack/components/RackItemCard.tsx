import React, { useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { COLORS } from '@/constants/theme';
import { formatProductPrice, getProductMainImage } from '@/features/products/utils/product-display';
import type { GarmentCategory } from '@/features/products/types/product';
import type { IRackItem } from '../types/rack';

const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  UPPER: 'Áo / Top',
  LOWER: 'Quần / Váy',
  FULL_BODY: 'Bộ liền / Suit',
};

interface RackItemCardProps {
  item: IRackItem;
  cardWidth: number;
  removing: boolean;
  onOpen: (productId: string) => void;
  onRemove: (rackItemId: string) => void;
}

export function RackItemCard({ item, cardWidth, removing, onOpen, onRemove }: RackItemCardProps) {
  const { product } = item;
  const imageUrl = getProductMainImage(product);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = imageUrl !== null && failedImageUrl === imageUrl;
  const mediaWidth = Math.max(1, cardWidth - 2);

  return (
    <View style={{ width: cardWidth }}>
      <Card variant="outlined" className="overflow-hidden !rounded-2xl !border-catalog-line !p-0">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở sản phẩm ${product.name}`}
          className="active:opacity-70"
          onPress={() => onOpen(item.productId)}
        >
          <View className="aspect-[3/4] w-full bg-catalog-muted">
            {imageUrl && !imageFailed ? (
              <Image
                source={{ uri: imageUrl }}
                contentFit="cover"
                transition={150}
                style={{ width: mediaWidth, height: mediaWidth / 0.75 }}
                onError={() => setFailedImageUrl(imageUrl)}
              />
            ) : (
              <View className="flex-1 items-center justify-center gap-xs">
                <Text className="font-sans text-headline-lg text-catalog-muted-text">◇</Text>
                <Text className="font-sans text-body-sm text-catalog-muted-text">Chưa có ảnh</Text>
              </View>
            )}
            <View className="absolute bottom-sm left-sm max-w-full rounded-md border border-catalog-line bg-surface-lowest/95 px-sm py-xs">
              <Text numberOfLines={1} className="font-sans text-2xs font-semibold text-primary-container">{CATEGORY_LABELS[product.category]}</Text>
            </View>
          </View>
          <View className="gap-xs p-md">
            {product.brand ? <Text className="font-sans text-2xs uppercase tracking-wide text-catalog-muted-text" numberOfLines={1}>{product.brand}</Text> : null}
            <Text className="min-h-9 font-sans text-label-lg text-primary-container" numberOfLines={2}>{product.name}</Text>
            {product.status !== 'ACTIVE' ? <Text className="font-sans text-body-sm text-danger">Hiện không khả dụng</Text> : null}
            <Text className="font-sans text-price-sm font-bold tabular-nums text-primary-container">{formatProductPrice(product.price)}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa ${product.name} khỏi Tủ đồ`}
          accessibilityState={{ disabled: removing, busy: removing }}
          disabled={removing}
          className="absolute right-xs top-xs min-h-11 min-w-11 items-center justify-center rounded-full border border-catalog-line bg-surface-lowest/95 active:bg-catalog-muted disabled:opacity-50"
          onPress={() => onRemove(item.id)}
        >
          {removing ? <ActivityIndicator size="small" color={COLORS.primaryContainer} /> : <X size={18} color={COLORS.catalogMutedText} />}
        </Pressable>
      </Card>
    </View>
  );
}
