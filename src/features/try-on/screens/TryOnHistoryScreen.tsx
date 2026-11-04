import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Check, Download, Eye, Search, Trash2, X, Zap } from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { useTryOnHistory } from '@/features/try-on/hooks/use-try-on-history';
import { useTryOnDelete } from '@/features/try-on/hooks/use-try-on-delete';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { TryOnResult } from '@/features/try-on/types/try-on';
import { COLORS } from '@/constants/theme';
import { formatDate } from '@/utils/date';

type CategoryFilter = 'ALL' | 'UPPER' | 'LOWER' | 'FULL_BODY';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UPPER', label: 'Áo' },
  { id: 'LOWER', label: 'Quần & váy' },
  { id: 'FULL_BODY', label: 'Đồ liền' },
];

const EYEBROW_CLASS =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink';

const outlineButtonClass =
  'h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:bg-landing-ivory';
const outlineButtonTextClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian';
// Nút nhỏ kiểu FE account-ui (sm) nhưng cao 44px cho ngón tay.
const SMALL_BUTTON_TEXT_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';
const ICON_BUTTON_CLASS =
  'h-11 w-11 items-center justify-center rounded-subtle border border-landing-line active:border-oxblood';
// Ô trạng thái rỗng / lỗi giống FE AccountStatePanel.
const STATE_PANEL_CLASS =
  'items-center border border-landing-line bg-landing-ivory/60 px-6 py-14';
// expo-image không nhận className nên ảnh lấp khung bằng style.
const FILL_IMAGE_STYLE = { width: '100%', height: '100%' } as const;

const SkeletonBlock: React.FC<{ width: number }> = ({ width }) => {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        aspectRatio: 3 / 4,
        opacity,
        backgroundColor: COLORS.taupe,
        borderRadius: 2,
      }}
    />
  );
};

export const TryOnHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const userTier = (user?.tier || 'FREE').toUpperCase();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTryOnHistory();

  const { remove, removeMany } = useTryOnDelete();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const allItems: TryOnResult[] = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  // Filter items by search term and category
  const filteredHistory = useMemo(() => {
    return allItems.filter((item) => {
      const productName = item.product?.name || (item as any).productId || 'Sản phẩm tự do';
      const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase().trim());

      let matchesCategory = selectedCategory === 'ALL';
      if (!matchesCategory) {
        const c = (item.category || '').toUpperCase();
        if (selectedCategory === 'UPPER' && (c === 'UPPER' || c === 'TOPS' || c === 'AO')) {
          matchesCategory = true;
        }
        if (
          selectedCategory === 'LOWER' &&
          (c === 'LOWER' || c === 'BOTTOMS' || c === 'QUAN' || c === 'VAY')
        ) {
          matchesCategory = true;
        }
        if (
          selectedCategory === 'FULL_BODY' &&
          (c === 'FULL_BODY' || c === 'ONE_PIECE' || c === 'ONE-PIECES' || c === 'SUIT' || c === 'DO_LIEN')
        ) {
          matchesCategory = true;
        }
      }
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchTerm, selectedCategory]);

  // Limit display history for free tier to 10 items
  const displayHistory = useMemo(() => {
    if (userTier === 'FREE' && filteredHistory.length > 10) {
      return filteredHistory.slice(0, 10);
    }
    return filteredHistory;
  }, [userTier, filteredHistory]);

  const isFiltered = searchTerm.trim().length > 0 || selectedCategory !== 'ALL';
  const allVisibleSelected =
    displayHistory.length > 0 && displayHistory.every((item) => selectedItems.has(item.id));

  const cardWidth = (width - 32 - 16) / 2;

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedItems.size === displayHistory.length && displayHistory.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayHistory.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItems(next);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    Alert.alert(
      'Xóa các mục đã chọn',
      `Bạn có chắc chắn muốn xóa ${selectedItems.size} kết quả thử đồ này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            removeMany.mutate(Array.from(selectedItems), {
              onSuccess: () => setSelectedItems(new Set()),
            });
          },
        },
      ]
    );
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert('Xóa kết quả thử đồ', 'Bạn có chắc chắn muốn xóa kết quả thử đồ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => remove.mutate(id),
      },
    ]);
  };

  const handleDownload = async (item: TryOnResult) => {
    try {
      setDownloadingId(item.id);
      await tryOnApi.downloadResult(item.id);
      Alert.alert('Thành công', 'Ảnh kết quả thử đồ đã được lưu vào thư viện ảnh.');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lưu ảnh kết quả.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Nhãn loại trang phục cùng câu chữ với FE (profile-history-page.tsx).
  const getGarmentsLabel = (item: TryOnResult) => {
    if (item.garments && Array.isArray(item.garments) && item.garments.length > 0) {
      const labels = item.garments.map((g) => {
        const c = (g.category || '').toUpperCase();
        if (c.includes('UPPER') || c.includes('AO') || c.includes('TOP')) return 'Áo';
        if (c.includes('LOWER') || c.includes('QUAN') || c.includes('VAY') || c.includes('BOTTOM'))
          return 'Quần & váy';
        if (c.includes('FULL_BODY') || c.includes('SUIT')) return 'Đồ liền';
        return 'Trang phục';
      });
      return labels.join(' + ');
    }
    const c = (item.category || '').toUpperCase();
    if (c.includes('UPPER') || c.includes('AO') || c.includes('TOP')) return 'Áo';
    if (c.includes('LOWER') || c.includes('QUAN') || c.includes('VAY') || c.includes('BOTTOM'))
      return 'Quần & váy';
    if (c.includes('FULL_BODY') || c.includes('SUIT')) return 'Đồ liền';
    return 'Trang phục';
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'ProfileTab' });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
  };

  // Render individual history card
  const renderItem = ({ item }: ListRenderItemInfo<TryOnResult>) => {
    const isSelected = selectedItems.has(item.id);
    // Tên hiển thị không lộ mã sản phẩm thô; FE dùng cùng câu thay thế.
    const productName = item.product?.name || 'Trang phục đã thử';
    const isDownloadingThis = downloadingId === item.id;

    return (
      <View style={{ width: cardWidth }} className="mb-8 min-w-0">
        <View
          className={`relative aspect-[3/4] overflow-hidden rounded-subtle border bg-ivory ${
            isSelected ? 'border-oxblood' : 'border-landing-line'
          }`}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem kết quả ${productName}`}
            onPress={() => navigation.navigate('TryOnDetail', { id: item.id })}
            className="h-full w-full active:opacity-90"
          >
            <Image
              source={{ uri: item.resultUrl }}
              style={FILL_IMAGE_STYLE}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Kết quả thử ${productName}`}
            />
          </Pressable>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`Chọn kết quả ${productName}`}
            onPress={() => toggleSelect(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className={`absolute left-2 top-2 h-7 w-7 items-center justify-center rounded-subtle border ${
              isSelected
                ? 'border-oxblood bg-oxblood'
                : 'border-landing-line bg-landing-paper/90'
            }`}
          >
            <Check
              size={14}
              strokeWidth={2.5}
              color={isSelected ? COLORS.ivory : 'transparent'}
            />
          </Pressable>

          {item.isCacheHit ? (
            <View
              accessible
              accessibilityLabel="Lấy từ kết quả đã lưu"
              className="absolute right-2 top-2 h-6 w-6 items-center justify-center bg-landing-obsidian/80"
            >
              <Zap size={12} strokeWidth={2} color={COLORS.brass} />
            </View>
          ) : null}

          {isDownloadingThis ? (
            <View className="absolute inset-0 items-center justify-center bg-landing-obsidian/40">
              <ActivityIndicator size="small" color={COLORS.ivory} />
            </View>
          ) : null}
        </View>

        <View className="mt-3 flex-row items-baseline justify-between gap-3">
          <Text
            numberOfLines={1}
            className="flex-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-ink"
          >
            {getGarmentsLabel(item)}
          </Text>
          <Text className="shrink-0 font-mono text-[11px] text-landing-muted">
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          className="mt-1 font-sans text-sm font-medium leading-snug text-landing-obsidian"
        >
          {productName}
        </Text>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem kết quả ${productName}`}
            onPress={() => navigation.navigate('TryOnDetail', { id: item.id })}
            className={ICON_BUTTON_CLASS}
          >
            <Eye size={16} strokeWidth={1.75} color={COLORS.obsidian} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Tải ảnh ${productName}`}
            accessibilityState={{ disabled: isDownloadingThis, busy: isDownloadingThis }}
            onPress={() => handleDownload(item)}
            disabled={isDownloadingThis}
            className={`${ICON_BUTTON_CLASS} ${isDownloadingThis ? 'opacity-50' : ''}`}
          >
            <Download size={16} strokeWidth={1.75} color={COLORS.obsidian} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xoá kết quả ${productName}`}
            onPress={() => handleDeleteItem(item.id)}
            className="h-11 w-11 items-center justify-center rounded-subtle border border-danger/40 active:opacity-70"
          >
            <Trash2 size={16} strokeWidth={1.75} color={COLORS.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <FlatList
        className="flex-1"
        contentContainerClassName="px-lg pt-lg pb-giant"
        data={displayHistory}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperClassName="gap-x-4"
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={[COLORS.oxblood]}
            tintColor={COLORS.oxblood}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <View className="border-b border-landing-line pb-5">
              <BackButton onPress={handleGoBack} />
              <Text className={`${EYEBROW_CLASS} mt-4`}>Tài khoản</Text>
              <Text
                accessibilityRole="header"
                className="mt-2 font-display text-headline-lg text-landing-obsidian"
              >
                Lịch sử thử đồ
              </Text>
              <Text className="mt-2 font-sans text-body-md leading-relaxed text-landing-muted">
                Ảnh kết quả từ Thử đồ AI bằng ảnh. Ảnh chụp trong phiên thử trực tiếp không được
                lưu ở đây.
              </Text>
            </View>

            <View className="mt-6 mb-5 h-11 flex-row items-center gap-2 rounded-subtle border border-landing-line bg-landing-ivory/80 pl-3">
              <Search size={16} strokeWidth={1.75} color={COLORS.muted} />
              <TextInput
                placeholder="Tìm theo tên sản phẩm…"
                placeholderTextColor={COLORS.muted}
                accessibilityLabel="Tìm theo tên sản phẩm"
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 p-0 font-sans text-body-md text-landing-obsidian"
              />
              {searchTerm.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xoá từ khoá tìm kiếm"
                  onPress={() => setSearchTerm('')}
                  className="h-11 w-11 items-center justify-center active:opacity-60"
                >
                  <X size={16} strokeWidth={1.75} color={COLORS.muted} />
                </Pressable>
              ) : null}
            </View>

            <View accessibilityRole="tablist" className="mb-6 flex-row gap-6 border-b border-landing-line">
              {CATEGORIES.map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setSelectedCategory(tab.id)}
                    className="relative h-11 justify-center active:opacity-70"
                  >
                    <Text
                      className={`font-sans text-sm ${
                        isActive ? 'font-medium text-oxblood' : 'text-landing-obsidian/70'
                      }`}
                    >
                      {tab.label}
                    </Text>
                    {isActive ? (
                      <View className="absolute -bottom-px left-0 right-0 h-0.5 bg-oxblood" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {selectedItems.size > 0 ? (
              <View
                accessibilityLiveRegion="polite"
                className="mb-6 flex-row flex-wrap items-center justify-between gap-3 border-y border-landing-line bg-landing-paper px-4 py-3"
              >
                <Text className="font-sans text-body-sm text-landing-obsidian">
                  Đã chọn <Text className="font-mono">{selectedItems.size}</Text> kết quả
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Bỏ chọn"
                    onPress={() => setSelectedItems(new Set())}
                    className="h-11 items-center justify-center rounded-subtle border border-landing-line px-3.5 active:bg-landing-ivory"
                  >
                    <Text className={`${SMALL_BUTTON_TEXT_CLASS} text-landing-obsidian`}>
                      Bỏ chọn
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Xoá đã chọn"
                    accessibilityState={{ disabled: removeMany.isPending, busy: removeMany.isPending }}
                    onPress={handleBulkDelete}
                    disabled={removeMany.isPending}
                    className={`h-11 items-center justify-center rounded-subtle border border-danger/40 px-3.5 ${
                      removeMany.isPending ? 'opacity-50' : 'active:opacity-70'
                    }`}
                  >
                    <Text className={`${SMALL_BUTTON_TEXT_CLASS} text-danger`}>
                      {removeMany.isPending ? 'Đang xoá…' : 'Xoá đã chọn'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {userTier === 'FREE' && allItems.length > 10 ? (
              <View className="mb-5 flex-row items-center gap-3 border-l-2 border-landing-brass bg-ivory px-4 py-3">
                <View className="flex-1 gap-1">
                  <Text className="font-sans text-body-sm font-semibold text-landing-obsidian">
                    Bạn đang xem 10 kết quả gần nhất
                  </Text>
                  <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                    Nâng lên Member bằng cách hoàn thành 1 đơn hàng để lưu trữ không giới hạn.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mua hàng ngay"
                  onPress={() => navigation.navigate('Main', { screen: 'ShopTab' })}
                  className="h-11 shrink-0 items-center justify-center rounded-subtle border border-landing-line px-3 active:bg-landing-paper"
                >
                  <Text className={`${SMALL_BUTTON_TEXT_CLASS} text-landing-obsidian`}>
                    Mua hàng ngay
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {displayHistory.length > 0 ? (
              <View className="mb-4 flex-row items-center justify-between gap-4">
                <Text className="font-sans text-xs text-landing-muted">
                  <Text className="font-mono text-landing-obsidian">{displayHistory.length}</Text>{' '}
                  kết quả
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={allVisibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  onPress={toggleSelectAll}
                  className="min-h-11 justify-center active:opacity-70"
                >
                  <Text
                    className={`font-sans text-xs underline-offset-4 ${
                      allVisibleSelected ? 'text-oxblood' : 'text-landing-obsidian'
                    }`}
                  >
                    {allVisibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View
              accessibilityLabel="Đang tải lịch sử thử đồ"
              className="flex-row flex-wrap gap-x-4"
            >
              {[0, 1, 2, 3].map((key) => (
                <View key={key} style={{ width: cardWidth }} className="mb-8">
                  <SkeletonBlock width={cardWidth} />
                </View>
              ))}
            </View>
          ) : isError ? (
            <View accessibilityRole="alert" className={STATE_PANEL_CLASS}>
              <Text className="text-center font-display text-2xl leading-tight text-danger">
                Không tải được lịch sử
              </Text>
              <Text className="mb-6 mt-2 text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                Kiểm tra kết nối rồi thử lại.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thử lại"
                onPress={() => refetch()}
                className={outlineButtonClass}
              >
                <Text className={outlineButtonTextClass}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <View className={STATE_PANEL_CLASS}>
              <Text className="text-center font-display text-2xl leading-tight text-landing-obsidian">
                {isFiltered ? 'Không có kết quả khớp' : 'Chưa có lịch sử thử đồ'}
              </Text>
              <Text className="mb-6 mt-2 text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                {isFiltered
                  ? 'Đổi từ khóa hoặc loại trang phục.'
                  : 'Kết quả Thử đồ AI bằng ảnh sẽ được lưu ở đây.'}
              </Text>
              {isFiltered ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xem tất cả"
                  onPress={resetFilters}
                  className={outlineButtonClass}
                >
                  <Text className={outlineButtonTextClass}>Xem tất cả</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mở phòng thử"
                  onPress={() =>
                    navigation.navigate('Main', {
                      screen: 'TryOnTab',
                      params: { screen: 'TryOnHome' },
                    })
                  }
                  className="h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
                >
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                    Mở phòng thử
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center justify-center">
              <ActivityIndicator size="small" color={COLORS.oxblood} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default TryOnHistoryScreen;
