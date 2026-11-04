import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Search, Shirt, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { mainProductImage } from '@/features/products/api/products.api';
import { useDebouncedValue } from '@/features/products/hooks/use-debounced-value';
import { useProducts } from '@/features/products/hooks/useProducts';
import type { IProduct } from '@/features/products/types/product';
import { formatCurrency } from '@/utils/format';

interface StylistProductPickerModalProps {
  visible: boolean;
  currentProductId?: string;
  onClose: () => void;
  onSelect: (product: IProduct) => void;
  onClear?: () => void;
}

function productImage(product: IProduct): string | undefined {
  return mainProductImage(product) ?? product.garmentUrl ?? undefined;
}

export function StylistProductPickerModal({
  visible,
  currentProductId,
  onClose,
  onSelect,
  onClear,
}: StylistProductPickerModalProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const productsQuery = useProducts({ search: debouncedSearch, limit: 20 });
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [productsQuery.data],
  );

  const close = () => {
    setSearch('');
    onClose();
  };

  const handleSelect = (product: IProduct) => {
    onSelect(product);
    close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-landing-obsidian/45">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng danh sách sản phẩm"
          className="flex-1"
          onPress={close}
        />
        {/* Bottom sheet theo design/DESIGN.md: góc trên 18px, tay nắm 40x4 taupe, chừa vùng an toàn đáy. */}
        <SafeAreaView
          edges={['bottom']}
          className="h-[88%] flex-col overflow-hidden rounded-t-xl bg-landing-paper"
        >
          <View className="mt-sm h-1 w-10 self-center rounded-subtle bg-taupe" />
          <View className="flex-row items-start justify-between gap-4 border-b border-landing-line px-5 pb-4 pt-3">
            <View className="flex-1">
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
                Món muốn phối cùng
              </Text>
              <Text
                accessibilityRole="header"
                className="mt-1.5 font-display text-2xl leading-tight text-landing-obsidian"
              >
                Chọn sản phẩm
              </Text>
              <Text className="mt-1 font-sans text-body-sm text-landing-muted">
                AI sẽ phối quanh sản phẩm thật trong cửa hàng.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              className="-mr-2 h-11 w-11 items-center justify-center active:opacity-70"
              onPress={close}
            >
              <X size={20} strokeWidth={1.75} color={COLORS.muted} />
            </Pressable>
          </View>

          <View className="border-b border-landing-line px-5 py-3">
            <View className="h-11 flex-row items-center gap-2 rounded-subtle border border-landing-line bg-ivory/80 px-3">
              <Search size={16} strokeWidth={1.75} color={COLORS.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tên sản phẩm…"
                placeholderTextColor={COLORS.muted}
                className="flex-1 font-sans text-body-md text-landing-obsidian"
                accessibilityLabel="Tìm sản phẩm"
                returnKeyType="search"
              />
            </View>
          </View>

          <FlatList
            className="flex-1"
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-2 px-4 pb-6 pt-3"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
                void productsQuery.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListHeaderComponent={
              currentProductId && onClear ? (
                <Pressable
                  accessibilityRole="button"
                  className="h-11 flex-row items-center justify-center rounded-subtle border border-dashed border-taupe active:bg-ivory"
                  onPress={() => {
                    onClear();
                    close();
                  }}
                >
                  <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                    Bỏ chọn sản phẩm
                  </Text>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              productsQuery.isLoading ? (
                <View className="items-center py-16">
                  <ActivityIndicator color={COLORS.oxblood} />
                </View>
              ) : (
                <View className="items-center gap-1 py-16">
                  <Text className="font-sans text-body-md text-landing-obsidian">
                    {debouncedSearch
                      ? 'Không tìm thấy sản phẩm phù hợp.'
                      : 'Chưa có sản phẩm nào.'}
                  </Text>
                  <Text className="font-sans text-body-sm text-landing-muted">
                    Thử từ khóa khác hoặc quay lại sau.
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              productsQuery.isFetchingNextPage ? (
                <View className="py-4">
                  <ActivityIndicator color={COLORS.oxblood} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const image = productImage(item);
              const isSelected = item.id === currentProductId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: isSelected }}
                  className={`flex-row items-center gap-3 rounded-subtle border p-2.5 active:opacity-80 ${
                    isSelected
                      ? 'border-oxblood bg-ivory'
                      : 'border-landing-line bg-ivory/60'
                  }`}
                  onPress={() => handleSelect(item)}
                >
                  <View className="h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-subtle border border-landing-line bg-landing-paper">
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        contentFit="contain"
                        transition={150}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : (
                      <Shirt size={18} strokeWidth={1.5} color={COLORS.muted} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={2}
                      className="font-display text-[15px] leading-snug text-landing-obsidian"
                    >
                      {item.name}
                    </Text>
                    <Text className="mt-1 font-mono text-[12px] text-oxblood">
                      {formatCurrency(item.price)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View className="h-6 w-6 items-center justify-center rounded-subtle bg-oxblood">
                      <Check size={14} strokeWidth={2.5} color={COLORS.paper} />
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default StylistProductPickerModal;
