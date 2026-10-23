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
      animationType="fade"
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng danh sách sản phẩm"
          className="flex-1"
          onPress={close}
        />
        <View className="h-4/5 rounded-t-3xl bg-surface-lowest px-lg pt-lg">
          <View className="flex-row items-center justify-between">
            <Text accessibilityRole="header" className="font-sans text-headline-sm text-on-surface-strong">
              Chọn sản phẩm
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              className="min-h-11 min-w-11 items-center justify-center rounded-full active:bg-catalog-muted"
              onPress={close}
            >
              <X size={20} color={COLORS.catalogMutedText} />
            </Pressable>
          </View>

          <View className="mt-sm flex-row items-center gap-sm rounded-full border border-catalog-line bg-catalog-muted px-md">
            <Search size={16} color={COLORS.catalogMutedText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm sản phẩm..."
              placeholderTextColor={COLORS.catalogMutedText}
              className="min-h-11 flex-1 font-sans text-body-md text-on-surface"
              accessibilityLabel="Tìm sản phẩm"
              returnKeyType="search"
            />
          </View>

          <FlatList
            className="flex-1"
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-sm pb-xxxl pt-md"
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
                  className="min-h-11 flex-row items-center justify-center rounded-xl border border-dashed border-outline-variant active:bg-catalog-muted"
                  onPress={() => {
                    onClear();
                    close();
                  }}
                >
                  <Text className="font-sans text-label-lg text-on-surface-variant">
                    Bỏ chọn sản phẩm
                  </Text>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              productsQuery.isLoading ? (
                <View className="items-center py-giant">
                  <ActivityIndicator color={COLORS.primaryContainer} />
                </View>
              ) : (
                <View className="items-center gap-1 py-giant">
                  <Text className="font-sans text-body-md text-on-surface-variant">
                    {debouncedSearch
                      ? 'Không tìm thấy sản phẩm phù hợp.'
                      : 'Chưa có sản phẩm nào.'}
                  </Text>
                  <Text className="font-sans text-body-sm text-catalog-muted-text">
                    Thử từ khóa khác hoặc quay lại sau.
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              productsQuery.isFetchingNextPage ? (
                <View className="py-lg">
                  <ActivityIndicator color={COLORS.primaryContainer} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const image = productImage(item);
              const isSelected = item.id === currentProductId;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className="min-h-20 flex-row items-center gap-md rounded-xl px-1 py-2 active:bg-catalog-muted"
                  onPress={() => handleSelect(item)}
                >
                  <View className="h-16 w-12 overflow-hidden rounded-lg border border-catalog-line bg-catalog-muted">
                    {image ? (
                      // expo-image does not consume NativeWind classes; fill the token-sized thumbnail.
                      <Image
                        source={{ uri: image }}
                        contentFit="cover"
                        transition={150}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Shirt size={20} color={COLORS.catalogMutedText} />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={2}
                      className="font-sans text-body-md font-semibold text-on-surface"
                    >
                      {item.name}
                    </Text>
                    <Text className="mt-1 font-sans text-price-sm text-primary-container">
                      {formatCurrency(item.price)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-container">
                      <Check size={14} color={COLORS.onPrimary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
