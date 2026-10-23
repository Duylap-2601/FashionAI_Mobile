import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { GarmentCategory, GarmentType, IProduct } from '../types/product';
import { formatProductPrice } from '../utils/product-display';
import { ProductDescription } from './ProductDescription';

interface ProductDetailContentProps {
  product: IProduct;
  rackAction?: React.ReactNode;
  selectedColor: string | null;
  unavailable: boolean;
  onReviewsPress: () => void;
  onSelectColor: (color: string) => void;
}

interface ProductColorOption {
  name: string;
  hex: string | null;
}

const colorOptionStyle = tva({
  base: 'min-h-11 min-w-11 flex-row items-center justify-center gap-sm rounded-full border bg-surface-lowest px-md',
  variants: {
    selected: {
      true: 'border-primary-container',
      false: 'border-surface-line',
    },
  },
});
const colorNameStyle = tva({
  base: 'font-sans text-body-md',
  variants: {
    selected: {
      true: 'font-semibold text-primary-container',
      false: 'font-medium text-catalog-muted-text',
    },
  },
});

const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  UPPER: 'Trang phục thân trên',
  LOWER: 'Trang phục thân dưới',
  FULL_BODY: 'Trang phục toàn thân',
};

const GARMENT_TYPE_LABELS: Record<GarmentType, string> = {
  SHIRT: 'Áo sơ mi',
  VEST: 'Áo vest',
  JACKET: 'Áo khoác',
  PANTS: 'Quần',
  SKIRT: 'Chân váy',
  DRESS: 'Đầm',
  JUMPSUIT: 'Jumpsuit',
};

function isDisplayableColor(value: string): boolean {
  return /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value.trim());
}

export function ProductDetailContent({
  product,
  rackAction,
  selectedColor,
  unavailable,
  onReviewsPress,
  onSelectColor,
}: ProductDetailContentProps) {
  const colorOptions = useMemo<ProductColorOption[]>(() => {
    if (product.colors?.length) {
      return product.colors.map((color) => ({
        name: color.name,
        hex: isDisplayableColor(color.hex) ? color.hex : null,
      }));
    }

    const singleColor = product.color?.trim();
    return singleColor ? [{ name: singleColor, hex: null }] : [];
  }, [product.color, product.colors]);
  const showOriginalPrice =
    product.originalPrice !== null && product.originalPrice > product.price;

  return (
    <View className="gap-xl p-lg">
      <View className="gap-sm">
        {product.brand ? (
          <Text
            selectable
            className="font-sans text-label-md uppercase tracking-widest text-catalog-muted-text"
          >
            {product.brand}
          </Text>
        ) : null}
        <Text
          selectable
          className="font-sans text-product-title text-primary-container"
        >
          {product.name}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Xem ${product.reviewCount} đánh giá của sản phẩm`}
          activeOpacity={0.68}
          onPress={onReviewsPress}
          className="min-h-11 min-w-11 flex-row items-center gap-xs self-start"
        >
          <Text
            accessibilityElementsHidden
            className="text-body-lg text-tertiary"
          >
            ★
          </Text>
          <Text className="font-sans text-body-md font-bold tabular-nums text-on-surface-strong">
            {product.avgRating.toFixed(1)}
          </Text>
          <Text className="font-sans text-body-md tabular-nums text-catalog-muted-text underline">
            ({product.reviewCount.toLocaleString('vi-VN')} đánh giá)
          </Text>
          <Text
            accessibilityElementsHidden
            className="text-headline-md text-catalog-muted-text"
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap items-center gap-sm">
        <Text
          selectable
          className="font-sans text-product-price tabular-nums text-primary-container"
        >
          {formatProductPrice(product.price)}
        </Text>
        {showOriginalPrice ? (
          <>
            <Text
              selectable
              className="font-sans text-body-md tabular-nums text-catalog-muted-text line-through"
            >
              {formatProductPrice(product.originalPrice!)}
            </Text>
            <Text className="rounded-full bg-catalog-muted px-sm py-xs font-sans text-body-sm font-bold text-primary-container">
              Giá ưu đãi
            </Text>
          </>
        ) : null}
      </View>

      {unavailable ? (
        <View
          accessibilityRole="alert"
          className="gap-xs rounded-md border border-surface-line bg-catalog-muted p-md"
        >
          <Text className="font-sans text-body-md font-bold text-on-surface-strong">
            Tạm ngừng nhận đơn
          </Text>
          <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">
            Sản phẩm hiện chưa sẵn sàng để thêm vào giỏ hàng.
          </Text>
        </View>
      ) : (
        <View className="min-h-7 flex-row items-center gap-sm">
          <View className="h-2 w-2 rounded-full bg-success" />
          <Text className="font-sans text-body-sm font-medium text-on-surface-strong">
            Đang nhận đơn may đo
          </Text>
        </View>
      )}

      {colorOptions.length > 0 ? (
        <View className="gap-md border-t border-catalog-line pt-xl">
          <Text className="font-sans text-body-lg font-semibold text-primary-container">
            Màu sắc
            {selectedColor ? (
              <Text className="font-normal text-catalog-muted-text">
                {' '}
                · {selectedColor}
              </Text>
            ) : null}
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {colorOptions.map((color) => {
              const selected = color.name === selectedColor;
              return (
                <TouchableOpacity
                  key={color.name}
                  accessibilityRole="radio"
                  accessibilityLabel={`Màu ${color.name}`}
                  accessibilityState={{ selected }}
                  activeOpacity={0.68}
                  onPress={() => onSelectColor(color.name)}
                  className={colorOptionStyle({ selected })}
                >
                  {color.hex ? (
                    <View
                      className="h-5 w-5 rounded-full border border-surface-line"
                      style={{ backgroundColor: color.hex }}
                    />
                  ) : null}
                  <Text className={colorNameStyle({ selected })}>
                    {color.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View className="gap-sm rounded-catalog-card border border-surface-line bg-catalog-tailoring p-lg">
        <Text className="font-sans text-label-md uppercase tracking-wide text-primary-container">
          MAY ĐO CÁ NHÂN
        </Text>
        <Text className="font-sans text-headline-sm text-primary-container">
          Thiết kế dành riêng cho số đo của bạn
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-on-surface-variant">
          FashionAI không dùng kích cỡ tiêu chuẩn. Số đo cơ thể sẽ được áp dụng
          trong quy trình đặt may để tạo độ vừa vặn phù hợp với riêng bạn.
        </Text>
      </View>

      {rackAction}

      <View className="gap-md border-t border-catalog-line pt-xl">
        <Text className="font-sans text-body-lg font-semibold text-primary-container">
          Thông tin sản phẩm
        </Text>
        <MetadataRow
          label="Danh mục"
          value={CATEGORY_LABELS[product.category]}
        />
        {product.garmentType ? (
          <MetadataRow
            label="Kiểu trang phục"
            value={GARMENT_TYPE_LABELS[product.garmentType]}
          />
        ) : null}
        {product.material ? (
          <MetadataRow label="Chất liệu" value={product.material} />
        ) : null}
      </View>

      {product.description?.trim() ? (
        <View className="gap-md border-t border-catalog-line pt-xl">
          <Text className="font-sans text-body-lg font-semibold text-primary-container">
            Chi tiết
          </Text>
          <ProductDescription key={`${product.id}:${product.description}`} description={product.description} />
        </View>
      ) : null}
    </View>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-9 flex-row items-start justify-between gap-lg">
      <Text className="flex-1 font-sans text-body-md text-catalog-muted-text">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right font-sans text-body-md font-medium text-on-surface-strong"
      >
        {value}
      </Text>
    </View>
  );
}
