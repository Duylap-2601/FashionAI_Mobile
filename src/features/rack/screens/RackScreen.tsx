import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '@/constants/theme';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { RackItemCard } from '../components/RackItemCard';
import { useClearRack, useRackItems, useRemoveRackItem } from '../hooks/useRack';
import type { IRackItem } from '../types/rack';

type RackNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export const RackScreen: React.FC = () => {
  const navigation = useNavigation<RackNavigation>();
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(1, (width - SPACING.lg * 2 - SPACING.md) / 2);
  const rackQuery = useRackItems();
  const removeMutation = useRemoveRackItem();
  const clearMutation = useClearRack();
  const items = rackQuery.data ?? [];

  const openProduct = useCallback(
    (productId: string) => {
      navigation.navigate('ProductDetail', { productId });
    },
    [navigation],
  );

  const removeItem = useCallback(
    (rackItemId: string) => {
      void removeMutation.mutateAsync(rackItemId).catch((error: unknown) => {
        Alert.alert('Không thể xóa khỏi Tủ đồ', getErrorMessage(error));
      });
    },
    [removeMutation],
  );

  const confirmClear = useCallback(() => {
    Alert.alert(
      'Dọn sạch Tủ đồ?',
      `${items.length} món sẽ bị bỏ khỏi Tủ đồ. Bạn có thể lưu lại từ trang sản phẩm.`,
      [
        { text: 'Giữ lại', style: 'cancel' },
        {
          text: 'Dọn tất cả',
          style: 'destructive',
          onPress: () => {
            void clearMutation.mutateAsync().catch((error: unknown) => {
              Alert.alert('Không thể xóa Tủ đồ', getErrorMessage(error));
            });
          },
        },
      ],
    );
  }, [clearMutation, items.length]);

  if (rackQuery.isLoading && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-landing-paper">
        <ActivityIndicator size="large" color={COLORS.oxblood} />
        <Text className={`${ACTION_LABEL_CLASS} text-landing-muted`}>Đang mở Tủ đồ</Text>
      </View>
    );
  }

  if (rackQuery.isError && items.length === 0) {
    return (
      <View accessibilityRole="alert" className="flex-1 items-center justify-center gap-4 bg-landing-paper px-6">
        <Text className="text-center font-display text-[22px] leading-tight text-landing-obsidian">
          Chưa thể tải Tủ đồ
        </Text>
        <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
          {getErrorMessage(rackQuery.error)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thử lại"
          onPress={() => void rackQuery.refetch()}
          className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
        >
          <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-landing-paper"
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperClassName="gap-md"
      contentContainerClassName="flex-grow gap-xxl px-lg pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={rackQuery.isRefetching}
      onRefresh={() => void rackQuery.refetch()}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View className="gap-xl pt-xxl">
          {/* Đầu trang kiểu FE rack-page: nhãn brass, tiêu đề serif, mô tả, viền mảnh. */}
          <View className="border-b border-landing-line pb-6">
            <Text className={LABEL_CLASS}>Tủ đồ</Text>
            <Text
              accessibilityRole="header"
              className="mt-3 font-display text-headline-lg text-landing-obsidian"
            >
              Tủ đồ cá nhân
            </Text>
            <Text className="mt-3 font-sans text-body-md leading-relaxed text-landing-muted">
              Lưu giữ những thiết kế yêu thích để xem lại bất cứ lúc nào.
            </Text>
            {items.length > 0 ? (
              <View className="mt-4 flex-row items-center">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dọn Tủ đồ"
                  accessibilityState={{
                    disabled: clearMutation.isPending || removeMutation.isPending,
                    busy: clearMutation.isPending,
                  }}
                  disabled={clearMutation.isPending || removeMutation.isPending}
                  onPress={confirmClear}
                  className="min-h-11 flex-row items-center gap-2 active:opacity-70 disabled:opacity-50"
                >
                  {clearMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                  ) : null}
                  <Text className="font-sans text-sm text-danger">Dọn Tủ đồ</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {items.length > 0 ? (
            <View className="flex-row items-baseline justify-between gap-4">
              <Text className="font-display text-[22px] leading-tight text-landing-obsidian">Đã lưu</Text>
              <Text className="font-mono text-xs text-landing-muted">
                {items.length.toLocaleString('vi-VN')} món
              </Text>
            </View>
          ) : null}

          {rackQuery.isError ? (
            <View accessibilityRole="alert" className="border-l-2 border-danger bg-ivory px-4 py-3">
              <Text className="font-sans text-body-sm leading-relaxed text-danger">
                Chưa thể cập nhật Tủ đồ mới nhất. Nội dung đã tải vẫn được giữ lại.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thử lại"
                onPress={() => void rackQuery.refetch()}
                className="mt-1 min-h-11 justify-center self-start active:opacity-70"
              >
                <Text className={`${ACTION_LABEL_CLASS} text-oxblood`}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }: { item: IRackItem }) => (
        <RackItemCard
          item={item}
          cardWidth={cardWidth}
          removing={removeMutation.isPending && removeMutation.variables === item.id}
          onOpen={openProduct}
          onRemove={removeItem}
        />
      )}
      ListEmptyComponent={
        <View className="items-center border border-landing-line bg-landing-ivory/60 px-6 py-14">
          <Text className="text-center font-display text-2xl leading-tight text-landing-obsidian">
            Tủ đồ đang trống
          </Text>
          <Text className="mt-2 max-w-[280px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            Lưu những sản phẩm bạn yêu thích từ trang chi tiết để xem lại tại đây.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem sản phẩm"
            onPress={() => navigation.navigate('ShopTab')}
            className="mt-6 h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>Xem sản phẩm</Text>
          </Pressable>
        </View>
      }
    />
  );
};
