import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  Camera,
  Check,
  Trash2,
  Eye,
  Download,
  Zap,
  MessageCircle,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { useTryOnHistory } from '@/features/try-on/hooks/use-try-on-history';
import { useTryOnDelete } from '@/features/try-on/hooks/use-try-on-delete';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { TryOnResult } from '@/features/try-on/types/try-on';
import { formatDate } from '@/utils/date';

const CATEGORIES = ['Tất cả', 'Tops', 'Bottoms', 'One-pieces'] as const;

export const TryOnHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
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

      let matchesCategory = selectedCategory === 'Tất cả';
      if (!matchesCategory) {
        const c = (item.category || '').toUpperCase();
        if (selectedCategory === 'Tops' && (c === 'UPPER' || c === 'TOPS' || c === 'AO')) {
          matchesCategory = true;
        }
        if (selectedCategory === 'Bottoms' && (c === 'LOWER' || c === 'BOTTOMS' || c === 'QUAN' || c === 'VAY')) {
          matchesCategory = true;
        }
        if (
          selectedCategory === 'One-pieces' &&
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

  const getGarmentsLabel = (item: TryOnResult) => {
    if (item.garments && Array.isArray(item.garments) && item.garments.length > 0) {
      const labels = item.garments.map((g) => {
        const c = (g.category || '').toUpperCase();
        if (c.includes('UPPER') || c.includes('AO') || c.includes('TOP')) return 'Áo';
        if (c.includes('LOWER') || c.includes('QUAN') || c.includes('VAY') || c.includes('BOTTOM'))
          return 'Quần/Váy';
        if (c.includes('FULL_BODY') || c.includes('SUIT')) return 'Bộ liền thân';
        return g.category || 'Trang phục';
      });
      return labels.join(' + ');
    }
    const c = (item.category || '').toUpperCase();
    if (c.includes('UPPER') || c.includes('AO') || c.includes('TOP')) return 'Áo';
    if (c.includes('LOWER') || c.includes('QUAN') || c.includes('VAY') || c.includes('BOTTOM'))
      return 'Quần/Váy';
    if (c.includes('FULL_BODY') || c.includes('SUIT')) return 'Bộ liền thân';
    return item.category || 'Trang phục';
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'ProfileTab' });
    }
  };

  // Render individual history card
  const renderItem = ({ item }: ListRenderItemInfo<TryOnResult>) => {
    const isSelected = selectedItems.has(item.id);
    const productName = item.product?.name || (item as any).productId || 'Sản phẩm tự do';
    const isDownloadingThis = downloadingId === item.id;

    return (
      <View
        className={`flex-1 m-1.5 rounded-2xl bg-white border overflow-hidden shadow-xs ${
          isSelected ? 'border-[#5D1C34] ring-2 ring-[#5D1C34]/20' : 'border-[#ECE8E3]'
        }`}
      >
        {/* Image Container with 3:4 Aspect Ratio */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('TryOnDetail', { id: item.id })}
          className="relative w-full bg-[#F3F4F6]"
          style={{ aspectRatio: 3 / 4 }}
        >
          <Image
            source={{ uri: item.resultUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />

          {/* Checkbox button top-left */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleSelect(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-md items-center justify-center z-10 ${
              isSelected
                ? 'bg-[#5D1C34] border border-[#5D1C34]'
                : 'bg-white/80 border border-[#D1D5DB]'
            }`}
          >
            {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>

          {/* Cache hit badge top-right */}
          {item.isCacheHit && (
            <View className="absolute top-2.5 right-2.5 bg-[#F59E0B] rounded-full p-1 shadow-xs z-10">
              <Zap size={12} color="#FFFFFF" />
            </View>
          )}

          {/* Downloading spinner overlay */}
          {isDownloadingThis && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center z-20">
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Card Info & Quick Actions */}
        <View className="p-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-[10px] font-bold text-[#5D1C34] uppercase tracking-wider">
              {getGarmentsLabel(item)}
            </Text>
            <Text className="text-[10px] text-[#9CA3AF]">{formatDate(item.createdAt)}</Text>
          </View>

          <Text className="text-[13px] font-semibold text-[#1B1C1B] mb-2" numberOfLines={1}>
            {productName}
          </Text>

          {/* Action Row */}
          <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
            <TouchableOpacity
              onPress={() => navigation.navigate('TryOnDetail', { id: item.id })}
              className="w-7 h-7 rounded-full bg-[#F3F4F6] items-center justify-center"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Eye size={13} color="#5D1C34" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDownload(item)}
              disabled={isDownloadingThis}
              className="w-7 h-7 rounded-full bg-[#F3F4F6] items-center justify-center"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Download size={13} color="#4B5563" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteItem(item.id)}
              className="w-7 h-7 rounded-full bg-[#FEF2F2] items-center justify-center"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Trash2 size={13} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#FBF9F7]">
      <AppHeader />

      {/* ── Main List & Content ── */}
      <FlatList
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 90,
        }}
        data={displayHistory}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={['#5D1C34']}
            tintColor="#5D1C34"
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View className="mb-2">
            {/* Title & Badge */}
            <BackButton onPress={handleGoBack} label="Quay lại" />
            <View className="mb-4 flex-row items-center gap-2.5">
              <Text className="text-[26px] font-bold text-[#1B1C1B]">Lịch sử Try-On</Text>
              {!isLoading && (
                <View className="px-2.5 py-0.5 rounded-full bg-[#E5E7EB]">
                  <Text className="text-[12px] font-bold text-[#4B5563]">
                    {displayHistory.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Search Input Bar */}
            <View className="flex-row items-center bg-white border border-[#E5E7EB] rounded-full px-3.5 py-2.5 mb-3.5 shadow-2xs">
              <Search size={16} color="#9CA3AF" />
              <TextInput
                placeholder="Tìm theo tên sản phẩm..."
                placeholderTextColor="#9CA3AF"
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 ml-2 text-[13.5px] text-[#1B1C1B] p-0"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchTerm('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={15} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Pills */}
            <View className="flex-row items-center bg-white border border-[#E5E7EB] rounded-full p-1 self-start mb-4 shadow-2xs">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full ${
                      isSelected ? 'bg-[#ECEAE6]' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[12.5px] ${
                        isSelected ? 'font-bold text-[#1B1C1B]' : 'font-medium text-[#6B7280]'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bulk Actions Sticky Header */}
            {selectedItems.size > 0 && (
              <View className="bg-[#5D1C34] px-4 py-2.5 rounded-2xl flex-row items-center justify-between mb-4 shadow-md">
                <View className="flex-row items-center gap-2.5">
                  <TouchableOpacity
                    onPress={toggleSelectAll}
                    className="w-5 h-5 rounded bg-white items-center justify-center"
                  >
                    <Check size={13} color="#5D1C34" strokeWidth={3} />
                  </TouchableOpacity>
                  <Text className="text-[13px] font-semibold text-white">
                    Đã chọn {selectedItems.size} mục
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => setSelectedItems(new Set())}
                    className="px-3 py-1.5 rounded-lg active:bg-white/10"
                  >
                    <Text className="text-[12.5px] font-medium text-white/80">Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleBulkDelete}
                    disabled={removeMany.isPending}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 bg-[#DC2626] rounded-lg shadow-sm"
                  >
                    <Trash2 size={13} color="#FFFFFF" />
                    <Text className="text-[12.5px] font-semibold text-white">
                      {removeMany.isPending ? 'Đang xóa...' : 'Xóa đã chọn'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Free Tier Limit Upgrade Banner */}
            {userTier === 'FREE' && allItems.length > 10 && (
              <View className="mb-4 bg-gradient-to-r bg-[#5D1C34]/5 border border-[#5D1C34]/15 rounded-2xl p-4 flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Sparkles size={14} color="#5D1C34" />
                    <Text className="text-[13px] font-bold text-[#1B1C1B]">
                      Bạn đang xem 10 kết quả gần nhất
                    </Text>
                  </View>
                  <Text className="text-[12px] text-[#6B7280] leading-4">
                    Nâng lên Member bằng cách hoàn thành 1 đơn hàng để lưu trữ không giới hạn.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Main', { screen: 'ShopTab' })}
                  className="px-3.5 py-2 bg-[#5D1C34] rounded-xl shadow-xs shrink-0"
                >
                  <Text className="text-[12px] font-bold text-white">Mua hàng ngay</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="py-24 items-center justify-center">
              <ActivityIndicator size="large" color="#5D1C34" />
              <Text className="text-[13px] text-[#6B7280] mt-3">Đang tải lịch sử thử đồ...</Text>
            </View>
          ) : isError ? (
            <View className="bg-white rounded-3xl border border-[#ECE8E3] py-12 px-6 items-center justify-center my-4">
              <Text className="text-[16px] font-bold text-[#1B1C1B] mb-1">
                Không tải được lịch sử
              </Text>
              <Text className="text-[13px] text-[#6B7280] text-center mb-4">
                Vui lòng kiểm tra kết nối mạng và thử lại.
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="px-6 py-2.5 bg-[#5D1C34] rounded-full"
              >
                <Text className="text-[13px] font-bold text-white">Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Empty State matching FE screenshot */
            <View className="bg-white rounded-3xl border border-dashed border-[#D1D5DB] py-14 px-6 items-center justify-center my-3 shadow-2xs">
              <View className="w-24 h-24 rounded-full bg-[#5D1C34]/5 items-center justify-center mb-6">
                <Camera size={44} color="#9CA3AF" strokeWidth={1.5} />
              </View>
              <Text className="text-[19px] font-bold text-[#1B1C1B] mb-2 text-center">
                {searchTerm || selectedCategory !== 'Tất cả'
                  ? 'Không tìm thấy kết quả'
                  : 'Chưa có lịch sử thử đồ'}
              </Text>
              <Text className="text-[13.5px] text-[#6B7280] text-center leading-5 mb-7 max-w-[280px]">
                {searchTerm || selectedCategory !== 'Tất cả'
                  ? 'Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.'
                  : 'Những bộ trang phục bạn đã thử bằng AI sẽ xuất hiện ở đây. Hãy khám phá và thử đồ ngay!'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Main', { screen: 'ShopTab' })}
                className="px-8 py-3.5 bg-[#5D1C34] rounded-full shadow-md items-center justify-center"
              >
                <Text className="text-white font-bold text-[14.5px]">Khám phá sản phẩm</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center justify-center">
              <ActivityIndicator size="small" color="#5D1C34" />
            </View>
          ) : null
        }
      />

      {/* ── Floating AI Chat Button ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Stylist')}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-[#5D1C34] shadow-lg shadow-black/30 items-center justify-center z-30"
      >
        <MessageCircle size={24} color="#FFFFFF" />
        <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F59E0B] border-2 border-white items-center justify-center">
          <Text className="text-[10px] font-bold text-black">1</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default TryOnHistoryScreen;
