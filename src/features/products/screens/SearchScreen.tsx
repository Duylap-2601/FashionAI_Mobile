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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Search, X, Clock, Trash2, TrendingUp, Sparkles } from 'lucide-react-native';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { IProduct } from '../types/product';
import { useDebouncedValue } from '../hooks/use-debounced-value';

const SEARCH_HISTORY_KEY = '@fashionai_search_history';

const POPULAR_SEARCHES = [
  'Áo sơ mi lụa',
  'Blazer công sở',
  'Đầm chữ A',
  'Quần tây âu',
  'Vest may đo',
  'Chân váy bút chì',
];

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialQuery = route.params?.query || '';

  const [input, setInput] = useState(initialQuery);
  const debouncedSearch = useDebouncedValue(input, 350);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const screenWidth = Dimensions.get('window').width;
  const numColumns = 2;
  const cardGap = 12;
  const horizontalPadding = 16;
  const cardWidth = (screenWidth - horizontalPadding * 2 - cardGap) / numColumns;

  // Load search history from storage
  useEffect(() => {
    AsyncStorage.getItem(SEARCH_HISTORY_KEY).then((data) => {
      if (data) {
        try {
          setHistory(JSON.parse(data));
        } catch {}
      }
    });

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const saveHistory = async (newHistory: string[]) => {
    setHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const addSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const filtered = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 10);
    saveHistory(updated);
  };

  const removeHistoryItem = (term: string) => {
    const updated = history.filter((h) => h !== term);
    saveHistory(updated);
  };

  const clearAllHistory = () => {
    saveHistory([]);
  };

  const handleSelectKeyword = (term: string) => {
    setInput(term);
    addSearchTerm(term);
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

  const handleProductPress = (productId: string) => {
    addSearchTerm(input);
    navigation.navigate('ProductDetail', { productId });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      {/* Header Search Bar */}
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-surface-line gap-2.5">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 -ml-1 rounded-full items-center justify-center active:bg-surface-line"
          accessibilityLabel="Quay lại"
        >
          <ArrowLeft size={20} color="#1A1A1A" />
        </Pressable>

        <View className="flex-1 flex-row items-center bg-surface-line/50 rounded-xl px-3 h-11 border border-surface-line">
          <Search size={16} color="#737373" />
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => {
              if (input.trim()) {
                addSearchTerm(input.trim());
              }
            }}
            placeholder="Tìm sản phẩm, chất liệu, kiểu dáng..."
            placeholderTextColor="#A3A3A3"
            returnKeyType="search"
            className="flex-1 ml-2 text-body-md text-on-surface h-full"
          />
          {input.length > 0 && (
            <Pressable
              onPress={() => setInput('')}
              className="w-7 h-7 rounded-full items-center justify-center active:opacity-70"
            >
              <X size={15} color="#737373" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Body Content */}
      {hasActiveSearch ? (
        // Results View
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#5D1C34" />
              <Text className="mt-3 text-body-sm text-on-surface-variant">
                Đang tìm kiếm sản phẩm...
              </Text>
            </View>
          ) : products.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-16 h-16 rounded-full bg-surface-line items-center justify-center mb-3">
                <Search size={28} color="#737373" />
              </View>
              <Text className="text-headline-sm font-bold text-on-surface text-center mb-1">
                Không tìm thấy sản phẩm
              </Text>
              <Text className="text-body-sm text-on-surface-variant text-center">
                Không có sản phẩm nào phù hợp với từ khóa "{activeSearch}". Bạn hãy thử tìm kiếm với từ khóa khác nhé.
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => String(item.id)}
              numColumns={numColumns}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                paddingTop: 16,
                paddingBottom: 32,
              }}
              columnWrapperStyle={{
                justifyContent: 'space-between',
                marginBottom: cardGap,
              }}
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
                <View className="mb-3">
                  <Text className="text-label-sm text-on-surface-variant">
                    Tìm thấy <Text className="font-bold text-primary">{products.length}</Text> sản phẩm cho "{activeSearch}"
                  </Text>
                </View>
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#5D1C34" />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      ) : (
        // Discovery / History View
        <View className="flex-1 px-4 py-4">
          {/* Lịch sử tìm kiếm */}
          {history.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Clock size={15} color="#737373" />
                  <Text className="text-label-sm font-bold text-on-surface uppercase tracking-wider">
                    Tìm kiếm gần đây
                  </Text>
                </View>
                <Pressable
                  onPress={clearAllHistory}
                  className="px-2 py-1 rounded active:opacity-70"
                >
                  <Text className="text-[12px] font-semibold text-primary">Xóa tất cả</Text>
                </Pressable>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {history.map((term, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center bg-surface border border-surface-line rounded-xl pl-3 pr-2 py-1.5 shadow-xs"
                  >
                    <Pressable onPress={() => handleSelectKeyword(term)}>
                      <Text className="text-body-sm text-on-surface mr-1">{term}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removeHistoryItem(term)}
                      className="p-1 rounded-full active:bg-surface-line"
                    >
                      <X size={12} color="#737373" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Gợi ý từ khóa phổ biến */}
          <View className="mb-6">
            <View className="flex-row items-center gap-1.5 mb-3">
              <TrendingUp size={15} color="#5D1C34" />
              <Text className="text-label-sm font-bold text-on-surface uppercase tracking-wider">
                Tìm kiếm phổ biến
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {POPULAR_SEARCHES.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSelectKeyword(item)}
                  className="px-3.5 py-2 bg-surface border border-surface-line rounded-xl active:bg-surface-line/50"
                >
                  <Text className="text-body-sm font-medium text-on-surface">{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* AI Banner */}
          <Pressable
            onPress={() => navigation.navigate('Stylist')}
            className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex-row items-center gap-3 active:opacity-85"
          >
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Sparkles size={20} color="#5D1C34" />
            </View>
            <View className="flex-1">
              <Text className="text-body-sm font-bold text-primary">
                Chưa tìm thấy phong cách ưng ý?
              </Text>
              <Text className="text-[12px] text-on-surface-variant mt-0.5">
                Nhờ AI Stylist tư vấn trang phục riêng theo vóc dáng của bạn
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
