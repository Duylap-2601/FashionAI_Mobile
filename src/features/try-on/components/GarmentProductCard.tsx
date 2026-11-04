import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { IProduct } from '@/features/products/types/product';
import { mainProductImage } from '@/features/products/api/products.api';
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/constants/theme';
import { TRY_ON_LABEL_CLASS } from '@/features/try-on/components/TryOnHeader';

interface GarmentSlotProps {
  label: string;
  hint?: string;
  product: IProduct | null;
  emptyLabel?: string;
  onChange: () => void;
  onClear?: () => void;
  disabled?: boolean;
}

const THUMB_STYLE = { width: 78, height: 104 } as const;
const QUIET_ACTION_CLASS = 'min-h-11 justify-center active:opacity-70';
const QUIET_ACTION_TEXT_CLASS =
  'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-muted';

// Ô trang phục kiểu FE (garment-slot.tsx): ảnh 78×104, nhãn brass, tên, giá, đổi/bỏ chọn.
export const GarmentSlot: React.FC<GarmentSlotProps> = ({
  label,
  hint,
  product,
  emptyLabel = 'Chưa chọn trang phục',
  onChange,
  onClear,
  disabled = false,
}) => {
  const imageUrl = product ? mainProductImage(product) : null;

  return (
    <View className={`flex-row gap-lg ${disabled ? 'opacity-50' : ''}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          product
            ? `Đổi ${label.toLowerCase()}: ${product.name}`
            : `Chọn ${label.toLowerCase()}`
        }
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onChange}
        className={`h-[104px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-subtle border ${
          product
            ? 'border-landing-line bg-ivory'
            : 'border-dashed border-taupe bg-ivory'
        }`}
      >
        {product && imageUrl ? (
          // expo-image không nhận className nên kích thước ô 78x104 nằm ở style.
          <Image
            source={{ uri: imageUrl }}
            style={THUMB_STYLE}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <Plus size={20} strokeWidth={1.5} color={COLORS.muted} />
        )}
      </Pressable>

      <View className="flex-1">
        <Text className={TRY_ON_LABEL_CLASS}>
          {label}
          {hint ? (
            <Text className="font-sans text-[11px] font-normal normal-case tracking-normal text-landing-muted">
              {' '}
              {hint}
            </Text>
          ) : null}
        </Text>

        {product ? (
          <>
            <Text
              numberOfLines={2}
              className="mt-1.5 font-sans text-sm font-medium leading-snug text-landing-obsidian"
            >
              {product.name}
            </Text>
            <Text className="mt-1 font-mono text-xs text-oxblood">
              {formatCurrency(product.price)}
            </Text>
          </>
        ) : (
          <Text className="mt-1.5 font-sans text-body-sm leading-relaxed text-landing-muted">
            {emptyLabel}
          </Text>
        )}

        <View className="mt-auto flex-row items-center gap-5 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${product ? 'Đổi món' : 'Chọn món'}: ${label.toLowerCase()}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onChange}
            className={QUIET_ACTION_CLASS}
          >
            <Text className={QUIET_ACTION_TEXT_CLASS}>
              {product ? 'Đổi món' : 'Chọn món'}
            </Text>
          </Pressable>
          {product && onClear ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bỏ chọn ${label.toLowerCase()}`}
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={onClear}
              className={QUIET_ACTION_CLASS}
            >
              <Text className={QUIET_ACTION_TEXT_CLASS}>Bỏ chọn</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default GarmentSlot;
