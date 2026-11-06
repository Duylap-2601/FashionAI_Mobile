import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal as RNModal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Search, X } from 'lucide-react-native';
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
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/constants/theme';
import { TRY_ON_LABEL_CLASS } from '@/features/try-on/components/TryOnHeader';

export type PickerCategory = GarmentCategory | 'ALL';

export type TryOnPickerSlot = 'single' | 'outer' | 'upper' | 'lower';

export const PICKER_CATEGORIES: { value: PickerCategory; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'UPPER', label: 'Áo / Blazer' },
  { value: 'LOWER', label: 'Quần / Váy' },
  { value: 'FULL_BODY', label: 'Bộ liền' },
];

const PAGE_LIMIT = 10;
const FILL_IMAGE_STYLE = { flex: 1 } as const;

interface ProductPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: IProduct) => void;
  selectedProductId?: string | null;
  categories?: { value: PickerCategory; label: string }[];
  initialCategory?: PickerCategory;
}

const ProductCard: React.FC<{
  item: IProduct;
  selected: boolean;
  onPress: () => void;
}> = ({ item, selected, onPress }) => {
  const imageUrl = mainProductImage(item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-1 active:opacity-80"
    >
      <View
        className={`relative aspect-[3/4] w-full overflow-hidden rounded-subtle border bg-ivory ${
          selected ? 'border-oxblood' : 'border-landing-line'
        }`}
      >
        {imageUrl ? (
          // expo-image không nhận className nên ảnh lấp khung bằng style.
          <Image
            source={{ uri: imageUrl }}
            style={FILL_IMAGE_STYLE}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="font-sans text-body-sm text-landing-muted">
              Chưa có ảnh
            </Text>
          </View>
        )}
        {selected ? (
          <View
            accessibilityLabel="Đang chọn"
            className="absolute right-2 top-2 h-6 w-6 items-center justify-center bg-oxblood"
          >
            <Check size={14} strokeWidth={2.5} color={COLORS.paper} />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={2}
        className="mt-2 font-sans text-sm font-medium leading-snug text-landing-obsidian"
      >
        {item.name}
      </Text>
      <Text className="mt-1 font-mono text-[12px] text-oxblood">
        {formatCurrency(item.price)}
      </Text>
    </Pressable>
  );
};

export const ProductPickerSheet: React.FC<ProductPickerSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selectedProductId,
  categories = PICKER_CATEGORIES,
  initialCategory = 'ALL',
}) => {
  const insets = useSafeAreaInsets();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PickerCategory>(initialCategory);

  // Danh mục mở đầu lấy từ initialCategory: TryOnWorkspace gắn key theo ô + trạng thái mở,
  // nên mỗi lần mở sheet là một lần mount mới và useState nhận lại giá trị đầu.

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
      selected={String(item.id) === String(selectedProductId ?? '')}
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
        <View className="flex-1 justify-end bg-landing-obsidian/45">
          <TouchableWithoutFeedback>
            <View
              className="h-[88%] flex-col overflow-hidden rounded-t-2xl border-t border-landing-line bg-landing-paper"
              style={{ paddingBottom: insets.bottom }}
            >
              {/* Thanh kéo 40x4 màu taupe theo DESIGN.md › Bottom Sheets */}
              <View className="items-center pt-2.5">
                <View className="h-1 w-10 bg-taupe" />
              </View>
              <View className="flex-row items-start justify-between gap-4 border-b border-landing-line px-5 pb-4 pt-3">
                <View className="flex-1">
                  <Text className={TRY_ON_LABEL_CLASS}>Phòng thử</Text>
                  <Text
                    accessibilityRole="header"
                    className="mt-1.5 font-display text-2xl leading-tight text-landing-obsidian"
                  >
                    Chọn trang phục
                  </Text>
                  <Text className="mt-1 font-sans text-body-sm text-landing-muted">
                    Chỉ gồm sản phẩm đang bán trong cửa hàng.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đóng"
                  onPress={onClose}
                  className="-mr-2 h-11 w-11 items-center justify-center active:opacity-70"
                >
                  <X size={20} strokeWidth={1.75} color={COLORS.muted} />
                </Pressable>
              </View>

              <View className="border-b border-landing-line px-5 pt-3">
                <View className="h-11 flex-row items-center gap-2 rounded-subtle border border-landing-line bg-ivory/80 px-3">
                  <Search size={16} strokeWidth={1.75} color={COLORS.muted} />
                  <TextInput
                    className="flex-1 font-sans text-body-md text-landing-obsidian"
                    placeholder="Tìm tên trang phục…"
                    placeholderTextColor={COLORS.muted}
                    value={searchInput}
                    onChangeText={setSearchInput}
                    returnKeyType="search"
                    accessibilityLabel="Tìm trang phục"
                  />
                </View>

                {categories.length > 1 ? (
                  <View accessibilityRole="tablist" className="mt-2 flex-row gap-5">
                    {categories.map((option) => {
                      const selected = category === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="tab"
                          accessibilityState={{ selected }}
                          onPress={() => setCategory(option.value)}
                          className={`h-11 justify-center ${
                            selected ? 'border-b-2 border-oxblood' : ''
                          }`}
                        >
                          <Text
                            className={`font-sans text-body-md ${
                              selected
                                ? 'font-medium text-oxblood'
                                : 'text-landing-obsidian/70'
                            }`}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View className="min-h-0 flex-1">
                {query.isLoading ? (
                  <View className="flex-1 items-center justify-center gap-3">
                    <ActivityIndicator color={COLORS.oxblood} />
                    <Text className="font-sans text-body-sm text-landing-muted">
                      Đang tải trang phục…
                    </Text>
                  </View>
                ) : query.isError ? (
                  <View className="flex-1 items-center justify-center gap-3 px-6">
                    <Text
                      accessibilityRole="alert"
                      className="text-center font-sans text-body-sm leading-relaxed text-landing-muted"
                    >
                      Không tải được trang phục. Vui lòng kiểm tra kết nối và thử lại.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Thử lại"
                      onPress={() => query.refetch()}
                      className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
                    >
                      <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                        Thử lại
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <FlatList
                    data={items}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    renderItem={renderItem}
                    columnWrapperClassName="gap-3"
                    contentContainerClassName="gap-3 px-4 pb-6 pt-4"
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => {
                      if (query.hasNextPage && !query.isFetchingNextPage) {
                        query.fetchNextPage();
                      }
                    }}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                      <Text className="py-10 text-center font-sans text-body-sm text-landing-muted">
                        Không có trang phục khớp. Thử từ khóa hoặc loại khác.
                      </Text>
                    }
                    ListFooterComponent={
                      query.isFetchingNextPage ? (
                        <View className="py-4">
                          <ActivityIndicator color={COLORS.oxblood} />
                        </View>
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
