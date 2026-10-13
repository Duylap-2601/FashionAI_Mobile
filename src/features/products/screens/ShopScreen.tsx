import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorView } from "@/components/common/ErrorView";
import { Input } from "@/components/ui/Input";
import { COLORS, SPACING } from "@/constants/theme";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { MainTabParamList, RootStackParamList } from "@/navigation/types";
import { ProductCard } from "../components/ProductCard";
import {
  ProductFilterModal,
  ProductFilterSelection,
} from "../components/ProductFilterModal";
import { ProductGridSkeleton } from "../components/ProductGridSkeleton";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { useProducts } from "../hooks/useProducts";
import { useFilterStore } from "../store/use-filter-store";
import { GarmentType, IProduct, IProductListFilters } from "../types/product";

type ShopNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "ShopTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

const PRODUCT_LIMIT = 20;
const GARMENT_TABS: { label: string; value: GarmentType | null }[] = [
  { label: "Tất cả", value: null },
  { label: "Áo sơ mi", value: "SHIRT" },
  { label: "Áo vest", value: "VEST" },
  { label: "Áo khoác", value: "JACKET" },
  { label: "Quần", value: "PANTS" },
  { label: "Chân váy", value: "SKIRT" },
  { label: "Đầm", value: "DRESS" },
  { label: "Jumpsuit", value: "JUMPSUIT" },
];

export const ShopScreen: React.FC = () => {
  const navigation = useNavigation<ShopNavigation>();
  const search = useFilterStore((state) => state.search);
  const category = useFilterStore((state) => state.category);
  const garmentType = useFilterStore((state) => state.garmentType);
  const color = useFilterStore((state) => state.color);
  const material = useFilterStore((state) => state.material);
  const minPrice = useFilterStore((state) => state.minPrice);
  const maxPrice = useFilterStore((state) => state.maxPrice);
  const status = useFilterStore((state) => state.status);
  const sort = useFilterStore((state) => state.sort);
  const setFilters = useFilterStore((state) => state.setFilters);

  const [searchInput, setSearchInput] = useState(search);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    const normalizedSearch = debouncedSearch.trim();
    if (normalizedSearch !== search) {
      setFilters({ search: normalizedSearch });
    }
  }, [debouncedSearch, search, setFilters]);

  const filterSelection = useMemo<ProductFilterSelection>(
    () => ({
      category,
      garmentType,
      color,
      material,
      minPrice,
      maxPrice,
      sort,
    }),
    [category, color, garmentType, material, maxPrice, minPrice, sort],
  );

  const queryFilters = useMemo<IProductListFilters>(
    () => ({
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
      ...(garmentType ? { garmentType } : {}),
      ...(color ? { color } : {}),
      ...(material ? { material } : {}),
      ...(minPrice !== null ? { minPrice } : {}),
      ...(maxPrice !== null ? { maxPrice } : {}),
      ...(status ? { status } : {}),
      sort,
      limit: PRODUCT_LIMIT,
    }),
    [
      category,
      color,
      garmentType,
      material,
      maxPrice,
      minPrice,
      search,
      sort,
      status,
    ],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useProducts(queryFilters);

  const products = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const totalProducts = data?.pages[0]?.meta.total ?? products.length;
  const activeFilterCount = useMemo(
    () =>
      [category, garmentType, color, material, minPrice, maxPrice].filter(
        (value) => value !== null && value !== "",
      ).length + (sort === "latest" ? 0 : 1),
    [category, color, garmentType, material, maxPrice, minPrice, sort],
  );
  const hasActiveFilters = activeFilterCount > 0;
  const productCardWidth = Math.max(
    1,
    (layoutWidth - SPACING.lg * 2 - SPACING.catalogGap) / 2,
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setLayoutWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setFilters({ search: "" });
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      category: null,
      garmentType: null,
      color: null,
      subCategory: null,
      material: null,
      minPrice: null,
      maxPrice: null,
      sort: "latest",
    });
  }, [setFilters]);

  const handleApplyFilters = useCallback(
    (selection: ProductFilterSelection) => {
      setFilters(selection);
      setFiltersVisible(false);
    },
    [setFilters],
  );

  const handleProductPress = useCallback(
    (productId: string) => {
      navigation.navigate("ProductDetail", { productId });
    },
    [navigation],
  );

  const renderProduct = useCallback<ListRenderItem<IProduct>>(
    ({ item }) => (
      <ProductCard
        presentation="catalog"
        product={item}
        cardWidth={productCardWidth}
        onPress={handleProductPress}
      />
    ),
    [handleProductPress, productCardWidth],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const header = (
    <View className="gap-sm pb-lg pt-lg">
      <Input
        accessibilityLabel="Tìm kiếm sản phẩm"
        autoCapitalize="none"
        autoCorrect={false}
        containerClassName="mx-lg !mb-0"
        fieldContainerClassName="!rounded-full !border-catalog-line !bg-surface-lowest"
        className="min-h-11 !py-sm font-sans !text-body-sm"
        leftIcon={<Search size={16} color={COLORS.catalogMutedText} />}
        placeholder="Tìm sản phẩm, chất liệu, phong cách..."
        returnKeyType="search"
        value={searchInput}
        onChangeText={setSearchInput}
        rightIcon={
          searchInput ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm"
              onPress={handleClearSearch}
              className="min-h-11 min-w-11 items-center justify-center active:opacity-70"
            >
              <Text className="font-sans text-headline-md text-catalog-muted-text">
                ×
              </Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-lg px-lg"
      >
        {GARMENT_TABS.map((tab) => (
          <Pressable
            key={tab.value ?? "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: garmentType === tab.value }}
            onPress={() => setFilters({ garmentType: tab.value })}
            className="min-h-11 min-w-11 items-center justify-center gap-xs active:opacity-70"
          >
            <Text
              className={`font-sans text-body-sm font-semibold ${garmentType === tab.value ? "text-primary-container" : "text-catalog-muted-text"}`}
            >
              {tab.label}
            </Text>
            <View
              className={`h-1 w-1 rounded-full ${garmentType === tab.value ? "bg-primary-container" : "bg-transparent"}`}
            />
          </Pressable>
        ))}
      </ScrollView>
      <View className="flex-row items-center justify-between border-b border-catalog-line px-lg pb-xs">
        <Text className="font-sans text-body-sm tabular-nums text-catalog-muted-text">
          {totalProducts.toLocaleString("vi-VN")} sản phẩm
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở bộ lọc${activeFilterCount ? `, ${activeFilterCount} đang áp dụng` : ""}`}
          onPress={() => setFiltersVisible(true)}
          className="min-h-11 flex-row items-center gap-sm active:opacity-70"
        >
          <SlidersHorizontal size={14} color={COLORS.primaryContainer} />
          <Text className="font-sans text-body-sm font-semibold text-primary-container underline">
            Sắp xếp / Lọc{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Text>
        </Pressable>
      </View>
      {isError && products.length > 0 ? (
        <View className="mx-lg flex-row items-center justify-between rounded-md bg-catalog-muted p-md">
          <Text className="flex-1 font-sans text-body-sm text-danger">
            Chưa thể cập nhật danh sách mới nhất.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refetch()}
            className="min-h-11 justify-center px-sm active:opacity-70"
          >
            <Text className="font-sans text-body-sm font-bold text-danger">
              Thử lại
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const filterModal = filtersVisible ? (
    <ProductFilterModal
      visible
      values={filterSelection}
      onApply={handleApplyFilters}
      onClose={() => setFiltersVisible(false)}
    />
  ) : null;

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-lowest" onLayout={handleLayout}>
        {header}
        <ProductGridSkeleton
          presentation="catalog"
          cardWidth={productCardWidth}
        />
        {filterModal}
      </View>
    );
  }

  if (isError && products.length === 0) {
    return (
      <View className="flex-1 bg-surface-lowest" onLayout={handleLayout}>
        {header}
        <View className="flex-1 items-center justify-center">
          <ErrorView
            title="Chưa thể tải sản phẩm"
            message="Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => void refetch()}
          />
        </View>
        {filterModal}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-lowest" onLayout={handleLayout}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(product) => product.id}
        numColumns={2}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="⌕"
            title="Không tìm thấy sản phẩm phù hợp"
            description="Hãy thử thay đổi từ khóa hoặc điều chỉnh bộ lọc của bạn."
            actionTitle={
              hasActiveFilters
                ? "Xóa bộ lọc"
                : search
                  ? "Xóa tìm kiếm"
                  : undefined
            }
            onAction={
              hasActiveFilters
                ? handleClearFilters
                : search
                  ? handleClearSearch
                  : undefined
            }
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="min-h-16 flex-row items-center justify-center gap-sm">
              <ActivityIndicator color={COLORS.primaryContainer} />
              <Text className="font-sans text-body-sm text-catalog-muted-text">
                Đang tải thêm...
              </Text>
            </View>
          ) : (
            <View className="h-xxl" />
          )
        }
        ItemSeparatorComponent={() => <View className="h-lg" />}
        columnWrapperClassName="items-start gap-catalog-gap px-lg"
        contentContainerClassName={`grow ${products.length === 0 ? "pb-xxxl" : ""}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={() => void refetch()}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
      />
      {filterModal}
    </View>
  );
};
