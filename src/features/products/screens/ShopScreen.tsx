import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  Pressable,
  StyleSheet,
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
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from "@/constants/theme";
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
import { IProduct, IProductListFilters } from "../types/product";

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
    Math.floor((layoutWidth - SPACING.lg * 2 - SPACING.md) / 2),
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
    <View style={styles.header}>
      <Text style={styles.intro}>
        Khám phá thiết kế công sở được may đo dành riêng cho bạn.
      </Text>
      <Input
        accessibilityLabel="Tìm kiếm sản phẩm"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.searchContainer}
        placeholder="Tìm sản phẩm, chất liệu, phong cách..."
        returnKeyType="search"
        value={searchInput}
        onChangeText={setSearchInput}
        rightIcon={
          searchInput ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm"
              hitSlop={8}
              onPress={handleClearSearch}
              style={({ pressed }) => [
                styles.clearSearch,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </Pressable>
          ) : null
        }
        style={styles.searchInput}
      />

      <View style={styles.toolbar}>
        <Text style={styles.resultCount}>
          {totalProducts.toLocaleString("vi-VN")} sản phẩm
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở bộ lọc${activeFilterCount ? `, ${activeFilterCount} đang áp dụng` : ""}`}
          onPress={() => setFiltersVisible(true)}
          style={({ pressed }) => [
            styles.filterButtonPressable,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.filterButton,
              hasActiveFilters && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                hasActiveFilters && styles.filterButtonTextActive,
              ]}
            >
              Bộ lọc
            </Text>
            {activeFilterCount ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      {isError && products.length > 0 ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>
            Chưa thể cập nhật danh sách mới nhất.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refetch()}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.inlineRetry}>Thử lại</Text>
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
      <View style={styles.screen} onLayout={handleLayout}>
        {header}
        <ProductGridSkeleton cardWidth={productCardWidth} />
        {filterModal}
      </View>
    );
  }

  if (isError && products.length === 0) {
    return (
      <View style={styles.screen} onLayout={handleLayout}>
        {header}
        <View style={styles.stateContainer}>
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
    <View style={styles.screen} onLayout={handleLayout}>
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
            <View style={styles.footerLoading}>
              <ActivityIndicator color={COLORS.primaryContainer} />
              <Text style={styles.footerLoadingText}>Đang tải thêm...</Text>
            </View>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          products.length === 0 && styles.emptyListContent,
        ]}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.commerceSurface,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  intro: {
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
  },
  searchContainer: {
    marginBottom: 0,
    marginHorizontal: SPACING.lg,
  },
  searchInput: {
    minHeight: 44,
    paddingVertical: SPACING.sm,
    color: COLORS.onSurface,
  },
  clearSearch: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchText: {
    fontSize: FONT_SIZE.xxl,
    lineHeight: 26,
    color: COLORS.onSurfaceVariant,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
  },
  resultCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
  },
  filterButtonPressable: {
    borderRadius: BORDER_RADIUS.full,
  },
  filterButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLowest,
  },
  filterButtonActive: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer,
  },
  filterButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryContainer,
  },
  filterButtonTextActive: {
    color: COLORS.onPrimary,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
    fontVariant: ["tabular-nums"],
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#FDECEC",
  },
  inlineErrorText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
    color: COLORS.danger,
  },
  inlineRetry: {
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  emptyListContent: {
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    alignItems: "flex-start",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  rowSeparator: {
    height: SPACING.xl,
  },
  pressed: {
    opacity: 0.7,
  },
  footerLoading: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  footerLoadingText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
  },
  footerSpace: {
    height: SPACING.xxl,
  },
});
