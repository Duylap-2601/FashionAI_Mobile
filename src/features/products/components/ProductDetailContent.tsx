import React, { useMemo, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { TextStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { IProduct } from '../types/product';
import { formatProductPrice } from '../utils/product-display';
import { ProductDescription } from './ProductDescription';
import { ProductMeasurementSummary } from './ProductMeasurementSummary';
import { ProductOutfitSuggestions } from './ProductOutfitSuggestions';
import { ProductReviewsSection } from './ProductReviewsSection';
import { RelatedProducts } from './RelatedProducts';

interface ProductDetailContentProps {
  product: IProduct;
  selectedColor: string | null;
  unavailable: boolean;
  onMeasurementsPress: () => void;
  onProductPress: (productId: string) => void;
  onReviewsPress: () => void;
  onReviewsSummaryPress: () => void;
  onWriteReviewPress: () => void;
  onReviewsSectionLayout: (offsetY: number) => void;
  onSelectColor: (color: string) => void;
  onAskStylist: () => void;
  onReturnPolicyPress: () => void;
}

interface ProductColorOption {
  name: string;
  hex: string | null;
}

const productNameStyle: TextStyle = {
  fontFamily: 'Playfair Display',
  fontSize: 32,
  lineHeight: 40,
  fontWeight: '600',
  color: COLORS.obsidian,
};

function isDisplayableColor(value: string): boolean {
  return /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value.trim());
}

export function ProductDetailContent({
  product,
  selectedColor,
  unavailable,
  onMeasurementsPress,
  onProductPress,
  onReviewsPress,
  onReviewsSummaryPress,
  onWriteReviewPress,
  onReviewsSectionLayout,
  onSelectColor,
  onAskStylist,
  onReturnPolicyPress,
}: ProductDetailContentProps) {
  const contentOffsetY = useRef(0);
  const reviewsOffsetY = useRef(0);

  const reportReviewsOffset = () => {
    onReviewsSectionLayout(contentOffsetY.current + reviewsOffsetY.current);
  };

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
    <View
      className="gap-xl p-lg"
      onLayout={(event) => {
        contentOffsetY.current = event.nativeEvent.layout.y;
        reportReviewsOffset();
      }}
    >
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
          onPress={onReviewsSummaryPress}
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
            <Text className="rounded-subtle bg-oxblood px-sm py-xs font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
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
          <Text className="font-display text-headline-sm text-obsidian">
            Màu sắc:
            {selectedColor ? (
              <Text className="font-normal text-landing-muted">
                {' '}
                {selectedColor}
              </Text>
            ) : null}
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {colorOptions.map((color) => {
              const selected = color.name === selectedColor;
              return (
                <TouchableOpacity
                  key={color.name}
                  accessibilityRole="radio"
                  accessibilityLabel={`Chọn màu ${color.name}`}
                  accessibilityState={{ selected }}
                  activeOpacity={0.68}
                  onPress={() => onSelectColor(color.name)}
                  className="h-11 w-11 items-center justify-center"
                >
                  <View
                    className={
                      selected
                        ? 'h-8 w-8 items-center justify-center rounded-full border-2 border-oxblood'
                        : 'h-8 w-8 items-center justify-center rounded-full'
                    }
                  >
                    <View
                      className={
                        color.hex
                          ? 'h-6 w-6 rounded-full border border-landing-line'
                          : 'h-6 w-6 rounded-full border border-taupe'
                      }
                      style={color.hex ? { backgroundColor: color.hex } : undefined}
                    />
                  </View>
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
        <Text className="font-display text-headline-sm text-obsidian">
          Thiết kế dành riêng cho số đo của bạn
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          FashionAI không dùng kích cỡ tiêu chuẩn. Số đo cơ thể sẽ được áp dụng
          trong quy trình đặt may để tạo độ vừa vặn phù hợp với riêng bạn.
        </Text>
        {/* Same note and link as FE product detail (ProductDetailTabs). */}
        <View className="mt-xs flex-row items-start gap-sm border-t border-landing-line pt-md">
          <View className="pt-xs">
            <AlertCircle size={16} strokeWidth={1.75} color={COLORS.brassInk} />
          </View>
          <View className="flex-1">
            <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
              Sản phẩm được may theo số đo đã lưu. Nếu sản phẩm có lỗi may hoặc
              sai lệch từ phía StAie., bạn có 7 ngày kể từ khi đơn hoàn tất để
              gửi yêu cầu đổi trả.
            </Text>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Xem chính sách đổi trả"
              activeOpacity={0.68}
              onPress={onReturnPolicyPress}
              className="min-h-11 justify-center self-start"
            >
              <Text className="font-sans text-body-sm font-semibold text-oxblood underline">
                Xem chính sách đổi trả
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ProductMeasurementSummary
        category={product.category}
        onPressMeasurements={onMeasurementsPress}
      />

      <View className="gap-md border-t border-landing-line pt-xl">
        <Text className="font-display text-headline-sm text-obsidian">
          Thông tin sản phẩm
        </Text>
        <View>
          {[
            ['Chất liệu', product.material?.trim() || 'Đang cập nhật'],
            ['Quy cách may', 'May đo theo số đo cá nhân'],
            [
              'Màu sắc',
              colorOptions.map((color) => color.name).join(', ') ||
                'Đang cập nhật',
            ],
            ['Xuất xứ', 'Thiết kế và may đo tại Việt Nam'],
            ['Bảo quản', 'Giặt nhẹ hoặc giặt khô, không dùng chất tẩy mạnh'],
          ].map(([label, value], index, rows) => (
            <MetadataRow
              key={label}
              label={label}
              value={value}
              last={index === rows.length - 1}
            />
          ))}
        </View>
      </View>

      {product.description?.trim() ? (
        <View className="gap-md border-t border-landing-line pt-xl">
          <Text className="font-display text-headline-sm text-obsidian">
            Chi tiết sản phẩm
          </Text>
          <ProductDescription key={`${product.id}:${product.description}`} description={product.description} />
        </View>
      ) : null}

      <ProductOutfitSuggestions product={product} onAskStylist={onAskStylist} />

      <View
        onLayout={(event) => {
          reviewsOffsetY.current = event.nativeEvent.layout.y;
          reportReviewsOffset();
        }}
      >
        <ProductReviewsSection
          productId={product.id}
          onViewAll={onReviewsPress}
          onWriteReview={onWriteReviewPress}
        />
      </View>

      <RelatedProducts product={product} onPressProduct={onProductPress} />
    </View>
  );
}

function MetadataRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-start gap-md py-3 ${
        last ? '' : 'border-b border-landing-line'
      }`}
    >
      <Text className="w-[110px] font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
        {label}
      </Text>
      <Text
        selectable
        className="flex-1 font-sans text-body-md leading-relaxed text-landing-muted"
      >
        {value}
      </Text>
    </View>
  );
}
