import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { IProduct } from '@/features/products/types/product';
import { mainProductImage } from '@/features/products/api/products.api';
import { formatCurrency } from '@/utils/format';

interface GarmentProductCardProps {
  product: IProduct;
  onChange: () => void;
  changeLabel?: string;
}

// Card sản phẩm đang chọn dùng chung cho màn Thử ảnh và Live.
export const GarmentProductCard: React.FC<GarmentProductCardProps> = ({
  product,
  onChange,
  changeLabel = 'Thay đổi',
}) => {
  const imageUrl = mainProductImage(product);
  return (
    <View className="flex-row items-center gap-md rounded-xl border border-surface-line bg-surface-lowest p-md shadow-sm">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="h-20 w-16 rounded-md"
          contentFit="cover"
        />
      ) : (
        <View className="h-20 w-16 items-center justify-center rounded-md bg-surface-low">
          <Text className="text-body-sm text-on-surface-variant">Không có ảnh</Text>
        </View>
      )}
      <View className="flex-1">
        {product.brand ? (
          <Text className="text-label-md text-on-surface-variant" numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}
        <Text className="mt-xs text-body-sm font-semibold text-on-surface" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="mt-xs text-price-sm text-primary-container">
          {formatCurrency(product.price)}
        </Text>
      </View>
      <Pressable className="min-h-11 justify-center px-sm" onPress={onChange}>
        <Text className="text-label-lg text-primary-container">{changeLabel} ›</Text>
      </Pressable>
    </View>
  );
};

export default GarmentProductCard;
