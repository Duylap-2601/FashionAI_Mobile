import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';
import {
  GarmentCategory,
  GarmentType,
  ProductSort,
} from '../types/product';

export interface ProductFilterSelection {
  category: GarmentCategory | null;
  garmentType: GarmentType | null;
  color: string | null;
  material: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: ProductSort;
}

interface ProductFilterModalProps {
  visible: boolean;
  values: ProductFilterSelection;
  onApply: (selection: ProductFilterSelection) => void;
  onClose: () => void;
}

interface Choice<T extends string> {
  label: string;
  value: T;
}

const CATEGORY_OPTIONS: Choice<GarmentCategory>[] = [
  { label: 'Áo', value: 'UPPER' },
  { label: 'Quần & chân váy', value: 'LOWER' },
  { label: 'Đầm & liền thân', value: 'FULL_BODY' },
];

const GARMENT_OPTIONS: Choice<GarmentType>[] = [
  { label: 'Sơ mi', value: 'SHIRT' },
  { label: 'Ghi-lê', value: 'VEST' },
  { label: 'Áo khoác', value: 'JACKET' },
  { label: 'Quần', value: 'PANTS' },
  { label: 'Chân váy', value: 'SKIRT' },
  { label: 'Đầm', value: 'DRESS' },
  { label: 'Jumpsuit', value: 'JUMPSUIT' },
];

const SORT_OPTIONS: Choice<ProductSort>[] = [
  { label: 'Mới nhất', value: 'latest' },
  { label: 'Giá tăng dần', value: 'price_asc' },
  { label: 'Giá giảm dần', value: 'price_desc' },
];

function optionalPrice(value: string): number | null {
  const normalized = value.trim();
  return normalized ? Number(normalized) : null;
}

function ChoiceChip<T extends string>({
  choice,
  selected,
  onPress,
}: {
  choice: Choice<T>;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chipPressable, pressed && styles.pressed]}
    >
      <View style={[styles.chip, selected && styles.chipSelected]}>
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {choice.label}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProductFilterModal({
  visible,
  values,
  onApply,
  onClose,
}: ProductFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<GarmentCategory | null>(
    values.category,
  );
  const [garmentType, setGarmentType] = useState<GarmentType | null>(
    values.garmentType,
  );
  const [color, setColor] = useState(values.color ?? '');
  const [material, setMaterial] = useState(values.material ?? '');
  const [minPrice, setMinPrice] = useState(
    values.minPrice?.toString() ?? '',
  );
  const [maxPrice, setMaxPrice] = useState(
    values.maxPrice?.toString() ?? '',
  );
  const [sort, setSort] = useState<ProductSort>(values.sort);
  const [priceError, setPriceError] = useState<string | null>(null);

  const handleReset = () => {
    setCategory(null);
    setGarmentType(null);
    setColor('');
    setMaterial('');
    setMinPrice('');
    setMaxPrice('');
    setSort('latest');
    setPriceError(null);
  };

  const handleApply = () => {
    const parsedMinPrice = optionalPrice(minPrice);
    const parsedMaxPrice = optionalPrice(maxPrice);
    const hasInvalidPrice =
      (parsedMinPrice !== null && (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)) ||
      (parsedMaxPrice !== null && (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0));

    if (hasInvalidPrice) {
      setPriceError('Vui lòng nhập mức giá hợp lệ.');
      return;
    }

    if (
      parsedMinPrice !== null &&
      parsedMaxPrice !== null &&
      parsedMinPrice > parsedMaxPrice
    ) {
      setPriceError('Giá tối thiểu không thể lớn hơn giá tối đa.');
      return;
    }

    onApply({
      category,
      garmentType,
      color: color.trim() || null,
      material: material.trim() || null,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      sort,
    });
  };

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
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng bộ lọc"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bộ lọc tìm kiếm</Text>
              <Text style={styles.subtitle}>Tinh chỉnh danh sách sản phẩm</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <View style={styles.chipGroup}>
                {CATEGORY_OPTIONS.map((choice) => (
                  <ChoiceChip
                    key={choice.value}
                    choice={choice}
                    selected={category === choice.value}
                    onPress={() =>
                      setCategory(category === choice.value ? null : choice.value)
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kiểu trang phục</Text>
              <View style={styles.chipGroup}>
                {GARMENT_OPTIONS.map((choice) => (
                  <ChoiceChip
                    key={choice.value}
                    choice={choice}
                    selected={garmentType === choice.value}
                    onPress={() =>
                      setGarmentType(
                        garmentType === choice.value ? null : choice.value,
                      )
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Màu sắc & chất liệu</Text>
              <TextInput
                accessibilityLabel="Màu sắc"
                placeholder="Ví dụ: đen, kem, xanh navy"
                placeholderTextColor={COLORS.outline}
                value={color}
                onChangeText={setColor}
                style={styles.input}
              />
              <TextInput
                accessibilityLabel="Chất liệu"
                placeholder="Ví dụ: cotton, linen, lụa"
                placeholderTextColor={COLORS.outline}
                value={material}
                onChangeText={setMaterial}
                style={styles.input}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Khoảng giá</Text>
              <View style={styles.priceRow}>
                <TextInput
                  accessibilityLabel="Giá tối thiểu"
                  keyboardType="number-pad"
                  placeholder="Từ"
                  placeholderTextColor={COLORS.outline}
                  value={minPrice}
                  onChangeText={(value) => {
                    setMinPrice(value);
                    setPriceError(null);
                  }}
                  style={[styles.input, styles.priceInput]}
                />
                <Text style={styles.priceSeparator}>–</Text>
                <TextInput
                  accessibilityLabel="Giá tối đa"
                  keyboardType="number-pad"
                  placeholder="Đến"
                  placeholderTextColor={COLORS.outline}
                  value={maxPrice}
                  onChangeText={(value) => {
                    setMaxPrice(value);
                    setPriceError(null);
                  }}
                  style={[styles.input, styles.priceInput]}
                />
              </View>
              {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sắp xếp</Text>
              <View style={styles.chipGroup}>
                {SORT_OPTIONS.map((choice) => (
                  <ChoiceChip
                    key={choice.value}
                    choice={choice}
                    selected={sort === choice.value}
                    onPress={() => setSort(choice.value)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, SPACING.xl) },
            ]}
          >
            <Button
              title="Xóa bộ lọc"
              onPress={handleReset}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              title="Áp dụng"
              onPress={handleApply}
              style={[styles.footerButton, styles.applyButton]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(27, 28, 27, 0.48)',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.commerceSurface,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLine,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 24,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
    color: COLORS.onSurfaceVariant,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryContainer,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.xxl,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.onSurface,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chipPressable: {
    borderRadius: BORDER_RADIUS.full,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  chipSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.onSurfaceVariant,
  },
  chipTextSelected: {
    color: COLORS.onPrimary,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceLine,
    backgroundColor: COLORS.surfaceLowest,
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priceInput: {
    flex: 1,
  },
  priceSeparator: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLine,
    backgroundColor: COLORS.surfaceLowest,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
  },
  applyButton: {
    backgroundColor: COLORS.primaryContainer,
  },
});
