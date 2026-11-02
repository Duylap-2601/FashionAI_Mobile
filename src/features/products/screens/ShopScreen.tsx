import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  Pressable,
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
import {
  ArrowUpDown,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import { MainTabParamList, RootStackParamList } from "@/navigation/types";
import { GarmentTypeTabs } from "../components/GarmentTypeTabs";
import { ProductCard } from "../components/ProductCard";
import {
  ProductFilterModal,
  ProductFilterSelection,
} from "../components/ProductFilterModal";
import { ProductGridSkeleton } from "../components/ProductGridSkeleton";
import { ProductSortSheet } from "../components/ProductSortSheet";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { useProducts } from "../hooks/useProducts";
import { useFilterStore } from "../store/use-filter-store";
import {
  GarmentType,
  IProduct,
  IProductListFilters,
  ProductSort,
} from "../types/product";

type ShopNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "ShopTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

const PRODUCT_LIMIT = 20;

export const ShopScreen: React.FC = () => {
  const navigation = useNavigation<ShopNavigation>();
  const search = useFilterStore((state) => state.search);
  const category = useFilterStore((state) => state.category);
  const garmentType = useFilterStore((state) => state.garmentType);
  const color = useFilterStore((state) => state.color);
  const subCategory = useFilterStore((state) => state.subCategory);
  const material = useFilterStore((state) => state.material);
  const minPrice = useFilterStore((state) => state.minPrice);
  const maxPrice = useFilterStore((state) => state.maxPrice);
  const status = useFilterStore((state) => state.status);
  const sort = useFilterStore((state) => state.sort);
  const setFilters = useFilterStore((state) => state.setFilters);

  const [searchInput, setSearchInput] = useState(search);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
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
      subCategory,
      material,
      minPrice,
      maxPrice,
      sort,
    }),
    [
      category,
      color,
      garmentType,
      material,
      maxPrice,
      minPrice,
      sort,
      subCategory,
    ],
  );

  const queryFilters = useMemo<IProductListFilters>(
    () => ({
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
      ...(garmentType ? { garmentType } : {}),
      ...(color ? { color } : {}),
      ...(subCategory ? { subCategory } : {}),
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
      subCategory,
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
  const activeFilterCount = useMemo(() => {
    const countValues = (value: string | null) =>
      value ? value.split(",").filter(Boolean).length : 0;

    return (
      countValues(color) +
      countValues(subCategory) +
      (maxPrice !== null ? 1 : 0)
    );
  }, [color, maxPrice, subCategory]);
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
    });
  }, [setFilters]);

  const handleSelectGarmentType = useCallback(
    (value: GarmentType | null) => {
      setFilters({ garmentType: value });
    },
    [setFilters],
  );

  const handleSelectSort = useCallback(
    (value: ProductSort) => {
      setFilters({ sort: value });
    },
    [setFilters],
  );

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
    <View className="gap-md pb-lg pt-lg">
      <View className="flex-row items-center gap-sm px-lg">
        <Input
          accessibilityLabel="Tìm kiếm sản phẩm"
          autoCapitalize="none"
          autoCorrect={false}
          containerClassName="flex-1 !mb-0"
          fieldContainerClassName={`!rounded-subtle !bg-landing-ivory !px-sm ${
            isSearchFocused
              ? "!border-2 !border-landing-oxblood"
              : "!border-landing-line"
          }`}
          className="font-sans !text-body-sm"
          leftIcon={<Search size={16} color={COLORS.catalogMutedText} />}
          placeholder="Tìm sản phẩm"
          returnKeyType="search"
          value={searchInput}
          onChangeText={setSearchInput}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở bộ lọc${activeFilterCount ? `, ${activeFilterCount} đang áp dụng` : ""}`}
          onPress={() => setFiltersVisible(true)}
          className="h-11 flex-row items-center gap-1.5 rounded-subtle border border-landing-obsidian px-3 active:opacity-70"
        >
          <SlidersHorizontal size={16} color={COLORS.obsidian} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
            Lọc
          </Text>
          {activeFilterCount > 0 ? (
            <Text className="font-mono text-[11px] tracking-normal text-landing-obsidian">
              ({activeFilterCount})
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở sắp xếp, đang chọn ${
            sort === "price_asc"
              ? "giá thấp đến cao"
              : sort === "price_desc"
                ? "giá cao đến thấp"
                : "mới nhất"
          }`}
          onPress={() => setSortSheetVisible(true)}
          className="h-11 w-11 items-center justify-center rounded-subtle border border-landing-obsidian active:opacity-70"
        >
          <ArrowUpDown size={16} color={COLORS.obsidian} />
        </Pressable>
      </View>

      <View>
        <GarmentTypeTabs
          activeGarmentType={garmentType}
          onSelect={handleSelectGarmentType}
        />
      </View>

      <View className="mx-lg flex-row items-baseline justify-between border-b border-landing-line pb-4">
        <Text className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted">
          <Text className="text-landing-obsidian">
            {totalProducts.toLocaleString("vi-VN")}
          </Text>{" "}
          sản phẩm
        </Text>
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
      filteredCount={totalProducts}
      onApply={handleApplyFilters}
      onClose={() => setFiltersVisible(false)}
    />
  ) : null;

  const sortSheet = sortSheetVisible ? (
    <ProductSortSheet
      visible
      sort={sort}
      onSelect={handleSelectSort}
      onClose={() => setSortSheetVisible(false)}
    />
  ) : null;

  if (isLoading) {
    return (
      <View className="flex-1 bg-landing-paper" onLayout={handleLayout}>
        {header}
        <ProductGridSkeleton
          presentation="catalog"
          cardWidth={productCardWidth}
        />
        {filterModal}
        {sortSheet}
      </View>
    );
  }

  if (isError && products.length === 0) {
    return (
      <View className="flex-1 bg-landing-paper" onLayout={handleLayout}>
        {header}
        <View className="flex-1 items-center justify-center">
          <ErrorView
            title="Chưa thể tải sản phẩm"
            message="Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => void refetch()}
          />
        </View>
        {filterModal}
        {sortSheet}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-landing-paper" onLayout={handleLayout}>
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
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
      {filterModal}
      {sortSheet}
    </View>
  );
};
