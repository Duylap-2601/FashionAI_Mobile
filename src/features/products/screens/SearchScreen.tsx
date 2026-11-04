import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton';
import { ProductsEmptyState } from '../components/ProductsEmptyState';
import { IProduct } from '../types/product';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useSearchHistory } from '../hooks/use-search-history';

// Same keywords as FE `constants/header-search.ts › POPULAR_SEARCH_KEYWORDS`.
const POPULAR_SEARCHES = [
  'Áo sơ mi lụa',
  'Blazer dạ tweed',
  'Đầm dạ hội dáng dài',
  'Quần tây ống suông',
  'Set vest nữ thanh lịch',
  'Chân váy chữ A',
  'Áo len cardigan',
  'Đầm hoa nhí vintage',
  'Áo polo cao cấp',
  'Váy công sở',
];

const SECTION_LABEL_CLASS =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';

export function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const initialQuery = route.params?.query || '';

  const [input, setInput] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearch = useDebouncedValue(input, 350);
  const { history, addHistory, removeHistory, clearHistory } =
    useSearchHistory();
  const inputRef = useRef<TextInput>(null);

  // Same 2-column grid as Shop: 16px side padding, 10px column gap, 16px row gap.
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 2;
  const cardWidth =
    (screenWidth - SPACING.lg * 2 - SPACING.catalogGap) / numColumns;

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Same triggers as FE: a term is saved when the user submits it, picks a
  // history or popular keyword, or opens a product from the results.
  const handleSelectKeyword = (term: string) => {
    setInput(term);
    void addHistory(term);
    Keyboard.dismiss();
  };

  // Query products when debouncedSearch has at least 2 characters
  const activeSearch = debouncedSearch.trim();
  const hasActiveSearch = activeSearch.length >= 2;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProducts(hasActiveSearch ? { search: activeSearch } : {});

  const products: IProduct[] = useMemo(() => {
    if (!hasActiveSearch || !data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [hasActiveSearch, data]);
  const totalResults = data?.pages[0]?.meta.total ?? products.length;

  const handleProductPress = (productId: string) => {
    void addHistory(input);
    navigation.navigate('ProductDetail', { productId });
  };

  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      {/* Header search bar: 44px, square 2px, ivory with a hairline (design/DESIGN.md › Search Bar). */}
      <View className="flex-row items-center gap-sm border-b border-landing-line bg-landing-paper px-lg py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="-ml-3 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <ArrowLeft size={20} strokeWidth={1.75} color={COLORS.obsidian} />
        </Pressable>

        <View
          className={`h-11 flex-1 flex-row items-center rounded-subtle bg-landing-ivory pl-3 ${
            isFocused
              ? 'border-2 border-landing-oxblood'
              : 'border border-landing-line'
          }`}
        >
          <Search size={16} strokeWidth={1.75} color={COLORS.muted} />
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => {
              void addHistory(input);
            }}
            accessibilityLabel="Tìm sản phẩm"
            placeholder="Tìm sản phẩm, chất liệu, phong cách..."
            placeholderTextColor={COLORS.muted}
            returnKeyType="search"
            className="ml-2 h-full flex-1 font-sans text-sm text-landing-obsidian"
          />
          {input.length > 0 && (
            <Pressable
              onPress={() => setInput('')}
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá tìm kiếm"
              className="h-11 w-11 items-center justify-center active:opacity-70"
            >
              <X size={14} strokeWidth={1.75} color={COLORS.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Body Content */}
      {hasActiveSearch ? (
        // Results View
        <View className="flex-1">
          {isLoading ? (
            <View className="pt-lg">
              <ProductGridSkeleton cardWidth={cardWidth} />
            </View>
          ) : products.length === 0 ? (
            <View className="flex-1 justify-center">
              <ProductsEmptyState
                title="Không tìm thấy sản phẩm"
                description={`Không có sản phẩm nào phù hợp với từ khóa “${activeSearch}”. Bạn hãy thử tìm kiếm với từ khóa khác nhé.`}
              />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => String(item.id)}
              numColumns={numColumns}
              contentContainerClassName="pb-xxxl pt-lg"
              columnWrapperClassName="items-start gap-catalog-gap px-lg"
              ItemSeparatorComponent={() => <View className="h-lg" />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  cardWidth={cardWidth}
                  onPress={handleProductPress}
                  presentation="catalog"
                />
              )}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={
                <View className="mx-lg mb-lg border-b border-landing-line pb-4">
                  <Text
                    accessibilityLiveRegion="polite"
                    className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted"
                  >
                    <Text className="text-landing-obsidian">
                      {totalResults.toLocaleString('vi-VN')}
                    </Text>{' '}
                    sản phẩm cho “{activeSearch}”
                  </Text>
                </View>
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="mx-lg mt-xxl flex-row items-center justify-center gap-sm border-t border-landing-line pt-xl">
                    <ActivityIndicator size="small" color={COLORS.oxblood} />
                    <Text className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted">
                      Đang tải thêm
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      ) : (
        // Discovery / History View. Scrolls so a full history never pushes the
        // other sections off screen; taps still land while the keyboard is open.
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-xxl p-lg"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Lịch sử tìm kiếm: chỉ hiện khi ô tìm kiếm đang trống */}
          {input.trim().length === 0 && history.length > 0 && (
            <View>
              <View className="mb-sm flex-row items-center justify-between gap-md border-b border-landing-line">
                <View className="flex-row items-center gap-sm">
                  <Clock size={14} strokeWidth={1.75} color={COLORS.brassInk} />
                  <Text accessibilityRole="header" className={SECTION_LABEL_CLASS}>
                    Lịch sử tìm kiếm
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xóa tất cả lịch sử tìm kiếm"
                  onPress={() => void clearHistory()}
                  className="-mr-sm min-h-11 flex-row items-center gap-xs px-sm active:opacity-70"
                >
                  <Trash2 size={14} strokeWidth={1.75} color={COLORS.oxblood} />
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-oxblood">
                    Xóa tất cả
                  </Text>
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-sm pt-xs">
                {history.map((term) => (
                  <View
                    key={term}
                    className="max-w-full flex-row items-center rounded-subtle border border-landing-line bg-landing-ivory"
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Tìm “${term}”`}
                      onPress={() => handleSelectKeyword(term)}
                      className="min-h-11 shrink justify-center pl-md active:opacity-70"
                    >
                      <Text
                        numberOfLines={1}
                        className="font-sans text-body-sm text-landing-obsidian"
                      >
                        {term}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa “${term}” khỏi lịch sử`}
                      onPress={() => void removeHistory(term)}
                      className="h-11 w-11 items-center justify-center active:opacity-70"
                    >
                      <X size={14} strokeWidth={1.75} color={COLORS.muted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Gợi ý từ khóa phổ biến */}
          <View>
            <View className="mb-sm min-h-11 flex-row items-center gap-sm border-b border-landing-line">
              <TrendingUp size={14} strokeWidth={1.75} color={COLORS.brassInk} />
              <Text accessibilityRole="header" className={SECTION_LABEL_CLASS}>
                Tìm kiếm phổ biến
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-sm pt-xs">
              {POPULAR_SEARCHES.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`Tìm “${item}”`}
                  onPress={() => handleSelectKeyword(item)}
                  className="min-h-11 justify-center rounded-subtle border border-landing-line bg-landing-ivory px-md active:opacity-70"
                >
                  <Text className="font-sans text-body-sm text-landing-obsidian">
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* AI Stylist: ivory block with a hairline, one real action into the stylist flow. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở AI Stylist để được tư vấn trang phục"
            onPress={() => navigation.navigate('Stylist')}
            className="flex-row items-center gap-md rounded-subtle border border-landing-line bg-landing-ivory p-lg active:opacity-80"
          >
            <View className="h-11 w-11 items-center justify-center border border-landing-line bg-landing-paper">
              <Sparkles size={18} strokeWidth={1.75} color={COLORS.oxblood} />
            </View>
            <View className="flex-1">
              <Text className={SECTION_LABEL_CLASS}>AI Stylist</Text>
              <Text className="mt-1 font-display text-headline-sm font-normal text-landing-obsidian">
                Chưa tìm thấy phong cách ưng ý?
              </Text>
              <Text className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                Nhờ AI Stylist tư vấn trang phục riêng theo vóc dáng của bạn.
              </Text>
            </View>
            <ChevronRight size={16} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
