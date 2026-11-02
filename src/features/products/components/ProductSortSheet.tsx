import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { PRODUCT_SORT_OPTIONS } from '../constants/product-filters';
import type { ProductSort } from '../types/product';

interface ProductSortSheetProps {
  visible: boolean;
  sort: ProductSort;
  onSelect: (sort: ProductSort) => void;
  onClose: () => void;
}

export function ProductSortSheet({
  visible,
  sort,
  onSelect,
  onClose,
}: ProductSortSheetProps) {
  const insets = useSafeAreaInsets();

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
          accessibilityLabel="Đóng sắp xếp"
          onPress={onClose}
          className="absolute inset-0 bg-landing-obsidian/45"
        />

        <View
          className="border-t border-landing-line bg-landing-paper"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-start justify-between gap-md border-b border-landing-line px-lg pb-5 pt-6">
            <View>
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-landing-brass-ink">
                Thứ tự hiển thị
              </Text>
              <Text className="mt-1.5 font-display text-[28px] leading-tight text-landing-obsidian">
                Sắp xếp
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              className="-mr-2 h-11 w-11 items-center justify-center active:opacity-70"
            >
              <X size={20} color={COLORS.muted} />
            </Pressable>
          </View>

          <View className="pt-sm pb-sm">
            {PRODUCT_SORT_OPTIONS.map((option, index) => {
              const isActive = sort === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  className={`min-h-16 flex-row items-center justify-between px-lg ${
                    index < PRODUCT_SORT_OPTIONS.length - 1
                      ? 'border-b border-landing-line'
                      : ''
                  } active:opacity-70`}
                >
                  <Text
                    className={`font-sans text-[15px] ${
                      isActive
                        ? 'font-semibold text-landing-oxblood'
                        : 'text-landing-obsidian'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {isActive ? (
                    <Check size={16} color={COLORS.oxblood} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
