import React, { useMemo } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import type { TextStyle } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS } from '@/constants/theme';
import type { GarmentCategory, GarmentType, IProduct } from '../types/product';
import { formatProductPrice } from '../utils/product-display';
import { ProductDescription } from './ProductDescription';
import { ProductMeasurementSummary } from './ProductMeasurementSummary';
import { ProductReviewsSection } from './ProductReviewsSection';
import { RelatedProducts } from './RelatedProducts';

interface ProductDetailContentProps {
  product: IProduct;
  rackAction?: React.ReactNode;
  selectedColor: string | null;
  unavailable: boolean;
  onMeasurementsPress: () => void;
  onProductPress: (productId: string) => void;
  onReviewsPress: () => void;
  onSelectColor: (color: string) => void;
}

interface ProductColorOption {
  name: string;
  hex: string | null;
}

const productNameStyle: TextStyle = {
  fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
  fontSize: 32,
  lineHeight: 40,
  fontWeight: '600',
  color: COLORS.obsidian,
};

const colorOptionStyle = tva({
  base: 'min-h-11 flex-row items-center justify-center gap-sm rounded-subtle bg-ivory px-md',
  variants: {
    selected: {
      true: 'border-2 border-oxblood',
      false: 'border border-landing-line',
    },
  },
});
const colorNameStyle = tva({
  base: 'font-sans text-body-md',
  variants: {
    selected: {
      true: 'font-semibold text-oxblood',
      false: 'font-medium text-landing-muted',
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
  onMeasurementsPress,
  onProductPress,
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
  const discountPercent = showOriginalPrice
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100,
      )
    : 0;

  return (
    <View className="gap-xl p-lg">
      <View className="gap-sm">
        {product.brand ? (
          <Text
            selectable
            className="font-sans text-label-md uppercase tracking-widest text-landing-muted"
          >
            {product.brand}
          </Text>
        ) : null}
        <Text selectable style={productNameStyle}>
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
            className="text-body-lg text-brass"
          >
            ★
          </Text>
          <Text className="font-mono text-body-md font-bold tabular-nums text-obsidian">
            {product.avgRating.toFixed(1)}
          </Text>
          <Text className="font-sans text-body-md tabular-nums text-landing-muted underline">
            ({product.reviewCount.toLocaleString('vi-VN')} đánh giá)
          </Text>
          <Text
            accessibilityElementsHidden
            className="text-headline-md text-landing-muted"
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap items-center gap-sm">
        <Text
          selectable
          className="font-mono text-product-price tabular-nums text-oxblood"
        >
          {formatProductPrice(product.price)}
        </Text>
        {showOriginalPrice ? (
          <>
            <Text
              selectable
              className="font-mono text-body-md tabular-nums text-landing-muted line-through"
            >
              {formatProductPrice(product.originalPrice!)}
            </Text>
            <Text className="rounded-subtle bg-oxblood px-sm py-xs font-mono text-label-md font-bold text-paper">
              {discountPercent > 0 ? `-${discountPercent}%` : 'Giá ưu đãi'}
            </Text>
          </>
        ) : null}
      </View>

      {unavailable ? (
        <View
          accessibilityRole="alert"
          className="gap-xs rounded-subtle border border-landing-line bg-ivory p-md"
        >
          <Text className="font-sans text-body-md font-bold text-obsidian">
            Tạm ngừng nhận đơn
          </Text>
          <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
            Sản phẩm hiện chưa sẵn sàng để thêm vào giỏ hàng.
          </Text>
        </View>
      ) : (
        <View className="min-h-7 flex-row items-center gap-sm">
          <View className="h-2 w-2 rounded-full bg-sage" />
          <Text className="font-sans text-body-sm font-medium text-sage-ink">
            Đang nhận đơn may đo
          </Text>
        </View>
      )}

      {colorOptions.length > 0 ? (
        <View className="gap-md border-t border-landing-line pt-xl">
          <Text className="font-sans text-body-lg font-semibold text-obsidian">
            Màu sắc
            {selectedColor ? (
              <Text className="font-normal text-landing-muted">
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
                      className="h-5 w-5 rounded-subtle border border-taupe"
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

      <View className="gap-sm rounded-subtle border border-landing-line bg-ivory p-lg">
        <Text className="font-sans text-label-md uppercase tracking-wide text-brass-ink">
          MAY ĐO CÁ NHÂN
        </Text>
        <Text className="font-sans text-headline-sm font-semibold text-obsidian">
          Thiết kế dành riêng cho số đo của bạn
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          FashionAI không dùng kích cỡ tiêu chuẩn. Số đo cơ thể sẽ được áp dụng
          trong quy trình đặt may để tạo độ vừa vặn phù hợp với riêng bạn.
        </Text>
      </View>

      <ProductMeasurementSummary
        category={product.category}
        onPressMeasurements={onMeasurementsPress}
      />

      {rackAction}

      <View className="gap-md border-t border-landing-line pt-xl">
        <Text className="font-sans text-body-lg font-semibold text-obsidian">
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
        <View className="gap-md border-t border-landing-line pt-xl">
          <Text className="font-sans text-body-lg font-semibold text-obsidian">
            Chi tiết
          </Text>
          <ProductDescription key={`${product.id}:${product.description}`} description={product.description} />
        </View>
      ) : null}

      <ProductReviewsSection
        productId={product.id}
        onViewAll={onReviewsPress}
      />

      <RelatedProducts product={product} onPressProduct={onProductPress} />
    </View>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-9 flex-row items-start justify-between gap-lg">
      <Text className="flex-1 font-sans text-body-md text-landing-muted">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 text-right font-sans text-body-md font-medium text-obsidian"
      >
        {value}
      </Text>
    </View>
  );
}
