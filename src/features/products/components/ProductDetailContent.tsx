import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';
import type {
  GarmentCategory,
  GarmentType,
  IProduct,
} from '../types/product';
import { formatProductPrice } from '../utils/product-display';

interface ProductDetailContentProps {
  product: IProduct;
  selectedColor: string | null;
  unavailable: boolean;
  onReviewsPress: () => void;
  onSelectColor: (color: string) => void;
}

interface ProductColorOption {
  name: string;
  hex: string | null;
}

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
    <View style={styles.content}>
      <View style={styles.heading}>
        {product.brand ? (
          <Text selectable style={styles.brand}>
            {product.brand}
          </Text>
        ) : null}
        <Text selectable style={styles.name}>
          {product.name}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Xem ${product.reviewCount} đánh giá của sản phẩm`}
          activeOpacity={0.68}
          onPress={onReviewsPress}
          style={styles.ratingButton}
        >
          <Text accessibilityElementsHidden style={styles.star}>
            ★
          </Text>
          <Text style={styles.ratingValue}>{product.avgRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>
            ({product.reviewCount.toLocaleString('vi-VN')} đánh giá)
          </Text>
          <Text accessibilityElementsHidden style={styles.chevron}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.priceRow}>
        <Text selectable style={styles.price}>
          {formatProductPrice(product.price)}
        </Text>
        {showOriginalPrice ? (
          <>
            <Text selectable style={styles.originalPrice}>
              {formatProductPrice(product.originalPrice!)}
            </Text>
            <Text style={styles.saleBadge}>Giá ưu đãi</Text>
          </>
        ) : null}
      </View>

      {unavailable ? (
        <View accessibilityRole="alert" style={styles.unavailableBanner}>
          <Text style={styles.unavailableTitle}>Tạm ngừng nhận đơn</Text>
          <Text style={styles.unavailableText}>
            Sản phẩm hiện chưa sẵn sàng để thêm vào giỏ hàng.
          </Text>
        </View>
      ) : (
        <View style={styles.availabilityRow}>
          <View style={styles.availabilityDot} />
          <Text style={styles.availabilityText}>Đang nhận đơn may đo</Text>
        </View>
      )}

      {colorOptions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Màu sắc
            {selectedColor ? (
              <Text style={styles.selectedValue}> · {selectedColor}</Text>
            ) : null}
          </Text>
          <View style={styles.colorList}>
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
                  style={[
                    styles.colorOption,
                    selected && styles.colorOptionSelected,
                  ]}
                >
                  {color.hex ? (
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color.hex },
                      ]}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.colorName,
                      selected && styles.colorNameSelected,
                    ]}
                  >
                    {color.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.madeToMeasure}>
        <Text style={styles.madeToMeasureKicker}>MAY ĐO CÁ NHÂN</Text>
        <Text style={styles.madeToMeasureTitle}>
          Thiết kế dành riêng cho số đo của bạn
        </Text>
        <Text style={styles.madeToMeasureBody}>
          FashionAI không dùng kích cỡ tiêu chuẩn. Số đo cơ thể sẽ được áp dụng
          trong quy trình đặt may để tạo độ vừa vặn phù hợp với riêng bạn.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
        <MetadataRow label="Danh mục" value={CATEGORY_LABELS[product.category]} />
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

      {product.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết</Text>
          <Text selectable style={styles.description}>
            {product.description}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <Text selectable style={styles.metadataValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    gap: SPACING.xl,
  },
  heading: {
    gap: SPACING.sm,
  },
  brand: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.2,
    color: COLORS.outline,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    lineHeight: 32,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  ratingButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  star: {
    fontSize: FONT_SIZE.md,
    color: COLORS.tertiary,
  },
  ratingValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
    fontVariant: ['tabular-nums'],
  },
  reviewCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
    textDecorationLine: 'underline',
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.outline,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  price: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.primaryContainer,
    fontVariant: ['tabular-nums'],
  },
  originalPrice: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.outline,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  saleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primarySoft,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
  },
  unavailableBanner: {
    padding: SPACING.md,
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLow,
  },
  unavailableTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  unavailableText: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    color: COLORS.onSurfaceVariant,
  },
  availabilityRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success,
  },
  availabilityText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.onSurface,
  },
  section: {
    gap: SPACING.md,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLine,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  selectedValue: {
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.onSurfaceVariant,
  },
  colorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  colorOptionSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primarySoft,
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  colorName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.onSurfaceVariant,
  },
  colorNameSelected: {
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
  },
  madeToMeasure: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryContainer,
  },
  madeToMeasureKicker: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.1,
    color: COLORS.primarySoft,
  },
  madeToMeasureTitle: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 24,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onPrimary,
  },
  madeToMeasureBody: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
    color: COLORS.onPrimary,
  },
  metadataRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  metadataLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
  },
  metadataValue: {
    flex: 1.5,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.onSurface,
    textAlign: 'right',
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
});
