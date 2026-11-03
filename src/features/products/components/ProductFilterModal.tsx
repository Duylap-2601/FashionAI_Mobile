import React, { useCallback, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import {
  AVAILABLE_COLORS,
  PRICE_FILTER,
  SUB_CATEGORIES,
} from '../constants/product-filters';
import {
  GarmentCategory,
  GarmentType,
  ProductSort,
} from '../types/product';

export interface ProductFilterSelection {
  category: GarmentCategory | null;
  garmentType: GarmentType | null;
  color: string | null;
  subCategory: string | null;
  material: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: ProductSort;
}

interface ProductFilterModalProps {
  visible: boolean;
  values: ProductFilterSelection;
  filteredCount: number;
  onApply: (selection: ProductFilterSelection) => void;
  onClose: () => void;
}

function toSelectionList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatVnd(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`;
}

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function PriceSlider({
  maxPrice,
  onChange,
}: {
  maxPrice: number | null;
  onChange: (value: number | null) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const currentValue = maxPrice ?? PRICE_FILTER.max;
  const ratio =
    (currentValue - PRICE_FILTER.min) / (PRICE_FILTER.max - PRICE_FILTER.min);
  const label =
    maxPrice === null ? 'Mọi mức giá' : `Dưới ${formatVnd(maxPrice)}`;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  }, []);

  const updateFromPosition = useCallback(
    (x: number) => {
      const width = trackWidthRef.current;
      if (!width) return;
      const clampedRatio = Math.min(1, Math.max(0, x / width));
      const rawValue =
        PRICE_FILTER.min +
        clampedRatio * (PRICE_FILTER.max - PRICE_FILTER.min);
      const stepped =
        Math.round(rawValue / PRICE_FILTER.step) * PRICE_FILTER.step;
      const nextValue = Math.min(
        PRICE_FILTER.max,
        Math.max(PRICE_FILTER.min, stepped),
      );
      onChange(nextValue >= PRICE_FILTER.max ? null : nextValue);
    },
    [onChange],
  );

  return (
    <View>
      <Text className="mb-3 font-mono text-[13px] text-landing-obsidian">
        {label}
      </Text>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Giá tối đa"
        accessibilityValue={{ text: label }}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) =>
          updateFromPosition(event.nativeEvent.locationX)
        }
        onResponderMove={(event) =>
          updateFromPosition(event.nativeEvent.locationX)
        }
        className="h-11 justify-center"
      >
        <View className="h-1 w-full rounded-full bg-landing-line" />
        <View
          className="absolute left-0 top-5 h-1 rounded-full bg-landing-oxblood"
          style={{ width: trackWidth * ratio }}
        />
        <View
          className="absolute top-3.5 h-4 w-4 rounded-full bg-landing-oxblood"
          style={{ left: Math.max(0, trackWidth * ratio - 8) }}
        />
      </View>

      <View className="mt-1 flex-row justify-between">
        <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
          {formatVnd(PRICE_FILTER.min)}
        </Text>
        <Text className="font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
          {formatVnd(PRICE_FILTER.max)}
        </Text>
      </View>
    </View>
  );
}

function FilterGroup({
  title,
  isFirst = false,
  children,
}: {
  title: string;
  isFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      className={
        isFirst
          ? 'pb-6'
          : 'border-t border-landing-line/70 py-6'
      }
    >
      <Text className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-landing-brass-ink">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function ProductFilterModal({
  visible,
  values,
  filteredCount,
  onApply,
  onClose,
}: ProductFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [subCategories, setSubCategories] = useState<string[]>(() =>
    toSelectionList(values.subCategory),
  );
  const [colors, setColors] = useState<string[]>(() =>
    toSelectionList(values.color),
  );
  const [maxPrice, setMaxPrice] = useState<number | null>(values.maxPrice);

  const hasDraftFilters =
    subCategories.length > 0 || colors.length > 0 || maxPrice !== null;

  const handleToggleSubCategory = useCallback((name: string) => {
    setSubCategories((current) => toggleValue(current, name));
  }, []);

  const handleToggleColor = useCallback((name: string) => {
    setColors((current) => toggleValue(current, name));
  }, []);

  const handleClearAll = useCallback(() => {
    setSubCategories([]);
    setColors([]);
    setMaxPrice(null);
  }, []);

  const handleApply = useCallback(() => {
    onApply({
      category: values.category,
      garmentType: values.garmentType,
      color: colors.length > 0 ? colors.join(',') : null,
      subCategory:
        subCategories.length > 0 ? subCategories.join(',') : null,
      material: values.material,
      minPrice: null,
      maxPrice,
      sort: values.sort,
    });
  }, [colors, maxPrice, onApply, subCategories, values]);

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng bộ lọc"
          onPress={onClose}
          className="absolute inset-0 bg-landing-obsidian/45"
        />

        <View className="max-h-[85%] border-t border-landing-line bg-landing-paper">
          <View className="flex-row items-start justify-between gap-4 border-b border-landing-line/70 px-4 pb-4 pt-5">
            <View>
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-landing-brass-ink">
                Tinh chỉnh
              </Text>
              <Text className="mt-1.5 font-display text-2xl font-normal leading-tight text-landing-obsidian">
                Bộ lọc
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              className="h-11 w-11 items-center justify-center active:opacity-70"
            >
              <X size={20} color={COLORS.oxblood} strokeWidth={1.75} />
            </Pressable>
          </View>

          <ScrollView
            className="shrink"
            contentContainerClassName="px-4 py-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FilterGroup title="Danh mục" isFirst>
              <View>
                {SUB_CATEGORIES.map((name) => {
                  const isChecked = subCategories.includes(name);
                  return (
                    <Pressable
                      key={name}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      onPress={() => handleToggleSubCategory(name)}
                      className="min-h-11 flex-row items-center gap-3 active:opacity-70"
                    >
                      <View
                        className={`h-4 w-4 shrink-0 items-center justify-center rounded-subtle border ${
                          isChecked
                            ? 'border-landing-oxblood bg-landing-oxblood'
                            : 'border-landing-obsidian/40'
                        }`}
                      >
                        {isChecked ? (
                          <Check
                            size={12}
                            color={COLORS.paper}
                            strokeWidth={2.5}
                          />
                        ) : null}
                      </View>
                      <Text
                        className={`flex-1 font-sans text-sm ${
                          isChecked
                            ? 'font-medium text-landing-obsidian'
                            : 'text-landing-obsidian/80'
                        }`}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FilterGroup>

            <FilterGroup title="Màu sắc">
              <View className="flex-row flex-wrap">
                {AVAILABLE_COLORS.map((swatch) => {
                  const isSelected = colors.includes(swatch.name);
                  const isLight = Boolean(swatch.light);
                  return (
                    <Pressable
                      key={swatch.name}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Màu ${swatch.name}`}
                      onPress={() => handleToggleColor(swatch.name)}
                      className="min-h-11 w-1/3 items-center gap-2 py-1 active:opacity-70"
                    >
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-full border p-1 ${
                          isSelected
                            ? 'border-landing-oxblood'
                            : 'border-transparent'
                        }`}
                      >
                        <View
                          className={`h-7 w-7 items-center justify-center rounded-full ${
                            isLight ? 'border border-landing-taupe' : ''
                          }`}
                          style={{ backgroundColor: swatch.color }}
                        >
                          {isSelected ? (
                            <Check
                              size={14}
                              color={isLight ? COLORS.obsidian : COLORS.paper}
                              strokeWidth={2.25}
                            />
                          ) : null}
                        </View>
                      </View>
                      <Text
                        className={`font-sans text-[11px] ${
                          isSelected
                            ? 'font-semibold text-landing-obsidian'
                            : 'text-landing-muted'
                        }`}
                      >
                        {swatch.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FilterGroup>

            <FilterGroup title="Khoảng giá">
              <PriceSlider maxPrice={maxPrice} onChange={setMaxPrice} />
            </FilterGroup>
          </ScrollView>

          <View
            className="flex-row gap-2 border-t border-landing-line/70 px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa tất cả bộ lọc"
              accessibilityState={{ disabled: !hasDraftFilters }}
              disabled={!hasDraftFilters}
              onPress={handleClearAll}
              className={`h-12 flex-1 items-center justify-center rounded-subtle border border-landing-obsidian/70 active:opacity-70 ${
                hasDraftFilters ? '' : 'opacity-50'
              }`}
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Xóa tất cả
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Xem ${filteredCount} sản phẩm`}
              onPress={handleApply}
              className="h-12 flex-[1.4] items-center justify-center rounded-subtle bg-landing-obsidian active:opacity-80"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                Xem {filteredCount} sản phẩm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
