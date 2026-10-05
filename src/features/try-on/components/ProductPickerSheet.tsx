import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal as RNModal,
  TouchableWithoutFeedback,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  getProducts,
  mainProductImage,
  productKeys,
} from '@/features/products/api/products.api';
import {
  GarmentCategory,
  IProduct,
} from '@/features/products/types/product';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/constants/theme';

export type PickerCategory = GarmentCategory | 'ALL';

export type TryOnPickerSlot = 'single' | 'upper' | 'lower';

export const PICKER_CATEGORIES: { value: PickerCategory; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'UPPER', label: 'Áo / Blazer' },
  { value: 'LOWER', label: 'Quần / Váy' },
  { value: 'FULL_BODY', label: 'Bộ liền' },
];

const PAGE_LIMIT = 10;

interface ProductPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: IProduct) => void;
  title?: string;
  subtitle?: string;
  categories?: { value: PickerCategory; label: string }[];
  initialCategory?: PickerCategory;
}

const ProductCard: React.FC<{ item: IProduct; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const imageUrl = mainProductImage(item);
  return (
    <Pressable className="mb-lg flex-1 px-sm" onPress={onPress}>
      <View className="overflow-hidden rounded-xl border border-surface-line bg-surface-lowest">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ aspectRatio: 3 / 4 }}
            className="w-full"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{ aspectRatio: 3 / 4 }}
            className="w-full items-center justify-center bg-surface-low"
          >
            <Text className="text-body-sm text-on-surface-variant">Không có ảnh</Text>
          </View>
        )}
        <View className="p-md">
          {item.brand ? (
            <Text className="text-label-md text-on-surface-variant" numberOfLines={1}>
              {item.brand}
            </Text>
          ) : null}
          <Text className="mt-xs text-body-sm font-semibold text-on-surface" numberOfLines={2}>
            {item.name}
          </Text>
          <Text className="mt-xs text-price-sm text-primary-container">
            {formatCurrency(item.price)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export const ProductPickerSheet: React.FC<ProductPickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Chọn trang phục thử đồ',
  subtitle = 'Chạm vào món bạn thích để chọn thử.',
  categories = PICKER_CATEGORIES,
  initialCategory = 'ALL',
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PickerCategory>(initialCategory);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useInfiniteQuery({
    queryKey: productKeys.list({
      ...(search ? { search } : {}),
      ...(category !== 'ALL' ? { category } : {}),
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getProducts(
        {
          ...(search ? { search } : {}),
          ...(category !== 'ALL' ? { category } : {}),
          limit: PAGE_LIMIT,
          page: pageParam as number,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: visible,
  });

  const items = query.data?.pages.flatMap((page) => page.data) ?? [];

  const renderItem = ({ item }: ListRenderItemInfo<IProduct>) => (
    <ProductCard
      item={item}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    />
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View className="h-3/4 rounded-t-xxl bg-surface-lowest">
              <View className="my-sm h-1.5 w-10 self-center rounded-full bg-surface-highest" />
              <View className="flex-row items-center justify-between px-xl pb-sm">
                <View className="flex-1">
                  <Text className="font-heading text-headline-sm font-bold text-primary-container">
                    {title}
                  </Text>
                  <Text className="mt-xs text-body-sm text-on-surface-variant">
                    {subtitle}
                  </Text>
                </View>
                <Pressable
                  className="min-h-11 min-w-11 items-center justify-center rounded-full"
                  accessibilityLabel="Đóng"
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} className="text-on-surface-variant" />
                </Pressable>
              </View>

              <View className="px-xl">
                <View className="flex-row items-center gap-sm rounded-md border border-surface-line bg-surface-low px-md">
                  <Ionicons name="search-outline" size={20} className="text-on-surface-variant" />
                  <TextInput
                    className="min-h-11 flex-1 py-sm text-body-lg text-on-surface"
                    placeholder="Tìm tên trang phục..."
                    placeholderTextColor={COLORS.outline}
                    value={searchInput}
                    onChangeText={setSearchInput}
                    returnKeyType="search"
                  />
                </View>
              </View>

              {categories.length > 1 ? (
                <View className="mt-md flex-row gap-sm px-xl">
                  {categories.map((option) => {
                    const selected = category === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        className={`min-h-11 flex-1 items-center justify-center rounded-full border px-md ${
                          selected ? 'border-primary-container bg-primary-container' : 'border-outline-variant'
                        }`}
                        onPress={() => setCategory(option.value)}
                      >
                        <Text
                          className={`text-label-lg ${
                            selected ? 'text-primary-foreground' : 'text-on-surface'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View className="mt-md flex-1 px-md">
                {query.isLoading ? (
                  <Loading message="Đang tải sản phẩm..." />
                ) : query.isError ? (
                  <ErrorView
                    title="Không tải được sản phẩm"
                    message="Vui lòng kiểm tra kết nối mạng và thử lại."
                    onRetry={() => query.refetch()}
                  />
                ) : (
                  <FlatList
                    data={items}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    renderItem={renderItem}
                    onEndReached={() => {
                      if (query.hasNextPage && !query.isFetchingNextPage) {
                        query.fetchNextPage();
                      }
                    }}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                      <EmptyState
                        icon="🛍️"
                        title="Không tìm thấy sản phẩm"
                        description="Thử từ khóa hoặc danh mục khác."
                      />
                    }
                    ListFooterComponent={
                      query.isFetchingNextPage ? (
                        <Loading message="Đang tải thêm..." />
                      ) : null
                    }
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

export default ProductPickerSheet;
