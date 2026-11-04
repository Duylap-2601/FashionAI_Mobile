import React, { useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { formatProductPrice, getProductMainImage } from '@/features/products/utils/product-display';
import type { GarmentCategory } from '@/features/products/types/product';
import type { IRackItem } from '../types/rack';

// Cùng nhãn loại với FE (rack-page.tsx › CATEGORY_LABELS).
const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  UPPER: 'Áo',
  LOWER: 'Quần & váy',
  FULL_BODY: 'Đồ liền',
};

interface RackItemCardProps {
  item: IRackItem;
  cardWidth: number;
  removing: boolean;
  onOpen: (productId: string) => void;
  onRemove: (rackItemId: string) => void;
}

/** Thẻ món đã lưu kiểu FE RackCard: ảnh 3:4 viền mảnh, nhãn brass, tên, giá mono oxblood. */
export function RackItemCard({ item, cardWidth, removing, onOpen, onRemove }: RackItemCardProps) {
  const { product } = item;
  const imageUrl = getProductMainImage(product);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = imageUrl !== null && failedImageUrl === imageUrl;
  const mediaWidth = Math.max(1, cardWidth - 2);
  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.brand ?? 'StAie.';

  return (
    <View style={{ width: cardWidth }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở sản phẩm ${product.name}`}
        className="active:opacity-80"
        onPress={() => onOpen(item.productId)}
      >
        <View className="aspect-[3/4] w-full overflow-hidden rounded-subtle border border-landing-line bg-ivory">
          {imageUrl && !imageFailed ? (
            // expo-image không nhận className nên kích thước 3:4 tính sẵn và để ở style.
            <Image
              source={{ uri: imageUrl }}
              contentFit="cover"
              contentPosition="top"
              transition={150}
              style={{ width: mediaWidth, height: mediaWidth / 0.75 }}
              onError={() => setFailedImageUrl(imageUrl)}
              accessibilityLabel={product.name}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="font-sans text-body-sm text-landing-muted">Chưa có ảnh</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={1}
          className="mt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-ink"
        >
          {categoryLabel}
        </Text>
        <Text
          numberOfLines={2}
          className="mt-1 font-sans text-sm font-medium leading-snug text-landing-obsidian"
        >
          {product.name}
        </Text>
        {product.status !== 'ACTIVE' ? (
          <Text className="mt-1 font-sans text-body-sm text-danger">Hiện không khả dụng</Text>
        ) : null}
        <Text className="mt-1 font-mono text-xs tabular-nums text-oxblood">
          {formatProductPrice(product.price)}
        </Text>
      </Pressable>
      {/* Vùng chạm 44x44, ô hiển thị 32x32 giấy mờ như FE. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xoá ${product.name} khỏi Tủ đồ`}
        accessibilityState={{ disabled: removing, busy: removing }}
        disabled={removing}
        className="absolute right-0 top-0 h-11 w-11 items-center justify-center active:opacity-70 disabled:opacity-50"
        onPress={() => onRemove(item.id)}
      >
        <View className="h-8 w-8 items-center justify-center bg-landing-paper/90">
          {removing ? (
            <ActivityIndicator size="small" color={COLORS.oxblood} />
          ) : (
            <X size={14} strokeWidth={1.75} color={COLORS.muted} />
          )}
        </View>
      </Pressable>
    </View>
  );
}
