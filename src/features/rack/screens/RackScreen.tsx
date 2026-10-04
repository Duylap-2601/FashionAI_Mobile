import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { RackItemCard } from '../components/RackItemCard';
import { useClearRack, useRackItems, useRemoveRackItem } from '../hooks/useRack';
import type { IRackItem } from '../types/rack';

type RackNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'RackTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export const RackScreen: React.FC = () => {
  const navigation = useNavigation<RackNavigation>();
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
      'Xóa toàn bộ Tủ đồ?',
      'Tất cả sản phẩm đã lưu sẽ bị xóa khỏi Tủ đồ của bạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => {
            void clearMutation.mutateAsync().catch((error: unknown) => {
              Alert.alert('Không thể xóa Tủ đồ', getErrorMessage(error));
            });
          },
        },
      ],
    );
  }, [clearMutation]);

  if (rackQuery.isLoading && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md text-body-sm text-on-surface-variant">Đang mở Tủ đồ...</Text>
      </View>
    );
  }

  if (rackQuery.isError && items.length === 0) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải Tủ đồ"
        message={getErrorMessage(rackQuery.error)}
        onRetry={() => void rackQuery.refetch()}
      />
    );
  }

  return (
    <FlatList
      className="flex-1 bg-surface"
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerClassName="flex-grow gap-md pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={rackQuery.isRefetching}
      onRefresh={() => void rackQuery.refetch()}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View className="gap-md px-lg pt-lg">
          <View className="flex-row items-center justify-between gap-md">
            <View className="flex-1">
              <Text className="text-headline-md text-on-surface">Tủ đồ cá nhân</Text>
              <Text className="mt-xs text-body-sm text-on-surface-variant">
                {items.length.toLocaleString('vi-VN')} sản phẩm đã lưu
              </Text>
            </View>
            {items.length > 0 ? (
              <Button
                title="Xóa tất cả"
                variant="ghost"
                size="sm"
                loading={clearMutation.isPending}
                disabled={removeMutation.isPending}
                textClassName="text-danger"
                onPress={confirmClear}
              />
            ) : null}
          </View>

          {rackQuery.isError ? (
            <View accessibilityRole="alert" className="rounded-lg bg-surface-low p-md">
              <Text className="text-body-sm text-danger">
                Chưa thể cập nhật Tủ đồ mới nhất. Nội dung đã tải vẫn được giữ lại.
              </Text>
              <Button
                title="Thử lại"
                variant="ghost"
                size="sm"
                className="mt-xs self-start"
                onPress={() => void rackQuery.refetch()}
              />
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }: { item: IRackItem }) => (
        <RackItemCard
          item={item}
          removing={removeMutation.isPending && removeMutation.variables === item.id}
          onOpen={openProduct}
          onRemove={removeItem}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="♢"
          title="Tủ đồ đang trống"
          description="Lưu những sản phẩm bạn yêu thích từ trang chi tiết để xem lại tại đây."
          actionTitle="Khám phá sản phẩm"
          onAction={() => navigation.navigate('ShopTab')}
        />
      }
    />
  );
};
