import React, { useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { RatingStars } from '@/features/reviews/components/RatingStars';
import { GARMENT_TYPE_TABS } from '../constants/product-filters';
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

const LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
const SECTION_TITLE_CLASS = 'font-display text-headline-md font-normal text-landing-obsidian';

// Same assurances and process steps as FE ProductPurchasePanel / ProductDetailTabs.
const ASSURANCES = ['May đo riêng', 'Tư vấn số đo', 'Đổi trả 7 ngày'] as const;
const TAILORING_STEPS = [
  ['01', 'Cung cấp số đo', 'Nhập số đo cơ thể trong trang hồ sơ hoặc khi đặt hàng.'],
  ['02', 'Thợ may cắt rập', 'Đội ngũ may đo tinh chỉnh rập cá nhân hóa cho từng khách hàng.'],
  ['03', 'Hoàn thiện và giao', 'Sản phẩm được kiểm tra form dáng trước khi giao đến bạn.'],
] as const;

function isDisplayableColor(value: string): boolean {
  return /^#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(value.trim());
}

// Light swatches carry a taupe border so they do not disappear on ivory (FE isLightHex).
function isLightHex(hex: string): boolean {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return false;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 200;
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
  const garmentTypeLabel = product.garmentType
    ? GARMENT_TYPE_TABS.find((tab) => tab.garmentType === product.garmentType)?.label
    : undefined;
  const hasReviews = product.reviewCount > 0 && product.avgRating > 0;
  const showOriginalPrice =
    product.originalPrice !== null && product.originalPrice > product.price;
  const discountPercent = showOriginalPrice
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100,
      )
    : 0;
  const description =
    product.description?.trim() ||
    `Sản phẩm ${product.name} được may đo theo số đo cá nhân đã lưu trong hồ sơ, hoàn thiện bởi StAie. và giao đến bạn sau khi kiểm tra form dáng.`;

  return (
    <View
      className="gap-xl p-lg"
      onLayout={(event) => {
        contentOffsetY.current = event.nativeEvent.layout.y;
        reportReviewsOffset();
      }}
    >
      {/* Purchase panel: ivory, hairline border (FE ProductPurchasePanel). */}
      <View className="border border-landing-line bg-landing-ivory p-5">
        <Text selectable className={LABEL_CLASS}>
          {product.brand || 'StAie. Signature'}
        </Text>
        {garmentTypeLabel ? (
          <View className="mt-3 self-start border border-landing-line px-2.5 py-1">
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-muted">
              {garmentTypeLabel}
            </Text>
          </View>
        ) : null}
        <Text
          selectable
          accessibilityRole="header"
          className="mt-4 font-display text-product-title font-medium text-landing-obsidian"
        >
          {product.name}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasReviews
              ? `${product.avgRating.toFixed(1)} trên 5 sao, xem ${product.reviewCount} đánh giá của sản phẩm`
              : 'Xem đánh giá sản phẩm'
          }
          onPress={onReviewsSummaryPress}
          className="mt-1 min-h-11 flex-row items-center gap-sm self-start active:opacity-70"
        >
          {hasReviews ? (
            <>
              <RatingStars value={product.avgRating} size="xs" />
              <Text className="font-mono text-xs tabular-nums text-landing-obsidian">
                {product.avgRating.toFixed(1)}
              </Text>
              <Text className="font-sans text-xs text-landing-muted underline">
                ({product.reviewCount.toLocaleString('vi-VN')} đánh giá)
              </Text>
            </>
          ) : (
            <Text className="font-sans text-xs text-landing-muted underline">
              Chưa có đánh giá
            </Text>
          )}
        </Pressable>

        <View className="mt-4 flex-row flex-wrap items-baseline gap-x-3 gap-y-2">
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
                className="font-mono text-sm tabular-nums text-landing-muted line-through"
              >
                {formatProductPrice(product.originalPrice!)}
              </Text>
              <View className="self-center bg-oxblood px-2 py-1">
                <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                  {discountPercent > 0 ? `-${discountPercent}%` : 'Giá ưu đãi'}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <View className="my-5 h-px w-full bg-landing-line" />

        {unavailable ? (
          <View
            accessibilityRole="alert"
            className="gap-xs border-l-2 border-danger bg-landing-paper px-md py-sm"
          >
            <Text className="font-sans text-body-md font-semibold text-landing-obsidian">
              Tạm ngừng nhận đơn
            </Text>
            <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
              Sản phẩm hiện chưa sẵn sàng để thêm vào giỏ hàng.
            </Text>
          </View>
        ) : (
          <View className="min-h-7 flex-row items-center gap-sm">
            <View className="h-2 w-2 rounded-full bg-sage" />
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-ink">
              Đang nhận đơn may đo
            </Text>
          </View>
        )}

        <View className="mt-5">
          {colorOptions.length > 0 ? (
            <>
              <Text className="mb-3 font-sans text-sm font-medium text-landing-obsidian">
                Màu sắc:{' '}
                <Text className="font-normal text-landing-muted">
                  {selectedColor ?? ''}
                </Text>
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="Chọn màu"
                className="flex-row flex-wrap gap-1.5"
              >
                {colorOptions.map((color) => {
                  const selected = color.name === selectedColor;
                  const light = color.hex ? isLightHex(color.hex) : true;
                  return (
                    <Pressable
                      key={color.name}
                      accessibilityRole="radio"
                      accessibilityLabel={`Chọn màu ${color.name}`}
                      accessibilityState={{ selected, checked: selected }}
                      onPress={() => onSelectColor(color.name)}
                      className={`min-h-11 w-16 items-center gap-1.5 rounded-subtle border-2 px-1 py-1.5 active:opacity-70 ${
                        selected ? 'border-oxblood' : 'border-transparent'
                      }`}
                    >
                      <View
                        className={`h-6 w-6 rounded-full border ${
                          light ? 'border-taupe' : 'border-landing-line'
                        }`}
                        style={color.hex ? { backgroundColor: color.hex } : undefined}
                      />
                      <Text
                        numberOfLines={1}
                        className={`font-sans text-[10px] ${
                          selected
                            ? 'font-semibold text-landing-obsidian'
                            : 'text-landing-muted'
                        }`}
                      >
                        {color.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text className="font-sans text-sm font-medium text-landing-obsidian">
                Màu sắc
              </Text>
              <Text className="mt-2 font-sans text-xs text-landing-muted">
                Màu tiêu chuẩn theo thiết kế.
              </Text>
            </>
          )}
        </View>

        <View className="mt-5 flex-row gap-1.5">
          {ASSURANCES.map((label) => (
            <View
              key={label}
              className="flex-1 items-center justify-center border border-landing-line px-1 py-2"
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-center font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-landing-muted"
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ProductMeasurementSummary
        category={product.category}
        onPressMeasurements={onMeasurementsPress}
      />

      {/* FE ProductDetailTabs › Mô tả sản phẩm: description block, then the metadata rows. */}
      <View className="gap-md border-t border-landing-line pt-xl">
        <Text accessibilityRole="header" className={SECTION_TITLE_CLASS}>
          Chi tiết sản phẩm
        </Text>
        <View className="border border-landing-line bg-landing-ivory p-4">
          <ProductDescription
            key={`${product.id}:${description}`}
            description={description}
          />
        </View>
        <View className="mt-xs border-y border-landing-line">
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

      <ProductOutfitSuggestions product={product} onAskStylist={onAskStylist} />

      {/* FE ProductDetailTabs › Quy trình may đo: mono step numbers and the real 7-day window. */}
      <View className="gap-md border-t border-landing-line pt-xl">
        <Text accessibilityRole="header" className={SECTION_TITLE_CLASS}>
          Quy trình may đo
        </Text>
        <View className="border border-landing-line bg-landing-ivory p-5">
          <Text className={LABEL_CLASS}>May đo cá nhân</Text>
          <Text className="mt-1.5 font-display text-lg text-landing-obsidian">
            Quy trình may đo theo số đo riêng
          </Text>
          <View className="mt-5 gap-4">
            {TAILORING_STEPS.map(([step, title, desc]) => (
              <View key={step} className="border-t border-landing-line pt-4">
                <Text className="font-mono text-lg text-oxblood">{step}</Text>
                <Text className="mt-1 font-sans text-sm font-semibold text-landing-obsidian">
                  {title}
                </Text>
                <Text className="mt-1 font-sans text-xs leading-relaxed text-landing-muted">
                  {desc}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View className="flex-row items-start gap-sm">
          <View className="pt-0.5">
            <AlertCircle size={16} strokeWidth={1.75} color={COLORS.brassInk} />
          </View>
          <View className="flex-1">
            <Text className="font-sans text-sm leading-relaxed text-landing-muted">
              Sản phẩm được may theo số đo đã lưu. Nếu sản phẩm có lỗi may hoặc
              sai lệch từ phía StAie., bạn có 7 ngày kể từ khi đơn hoàn tất để
              gửi yêu cầu đổi trả.
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Xem chính sách đổi trả"
              onPress={onReturnPolicyPress}
              className="min-h-11 justify-center self-start active:opacity-70"
            >
              <Text className="font-sans text-sm font-semibold text-oxblood underline">
                Xem chính sách đổi trả
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

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
        className="flex-1 font-sans text-sm leading-relaxed text-landing-muted"
      >
        {value}
      </Text>
    </View>
  );
}
