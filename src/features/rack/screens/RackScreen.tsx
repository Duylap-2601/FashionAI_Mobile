import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View, useWindowDimensions } from 'react-native';
import { Shirt } from 'lucide-react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ErrorView } from '@/components/common/ErrorView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
      <View className="flex-1 items-center justify-center bg-surface-lowest">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md font-sans text-body-sm text-catalog-muted-text">Đang mở Tủ đồ...</Text>
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
      className="flex-1 bg-surface-lowest"
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperClassName="gap-md"
      contentContainerClassName="flex-grow gap-lg px-lg pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={rackQuery.isRefetching}
      onRefresh={() => void rackQuery.refetch()}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View className="gap-xl pt-xxl">
          <View className="gap-sm">
            <Text accessibilityRole="header" className="font-sans text-headline-lg font-bold text-primary-container">Tủ đồ cá nhân</Text>
            <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">Lưu giữ những thiết kế yêu thích để xem lại bất cứ lúc nào.</Text>
          </View>
          <Card variant="outlined" className="flex-row flex-wrap items-center justify-between gap-sm !rounded-2xl !border-catalog-line">
            <View className="gap-xs">
              <Text className="font-sans text-body-md font-bold text-primary-container">Tủ đồ đã lưu</Text>
              <Text className="font-sans text-body-sm text-catalog-muted-text">{items.length.toLocaleString('vi-VN')} sản phẩm</Text>
            </View>
            {items.length > 0 ? (
              <Button
                title="Xóa tất cả"
                variant="outline"
                size="sm"
                loading={clearMutation.isPending}
                disabled={removeMutation.isPending}
                className="!rounded-xl !border-catalog-line"
                textClassName="font-sans !text-danger"
                onPress={confirmClear}
              />
            ) : null}
          </Card>

          {rackQuery.isError ? (
            <View accessibilityRole="alert" className="rounded-xl border border-catalog-line bg-catalog-muted p-lg">
              <Text className="font-sans text-body-sm text-danger">
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
          cardWidth={cardWidth}
          removing={removeMutation.isPending && removeMutation.variables === item.id}
          onOpen={openProduct}
          onRemove={removeItem}
        />
      )}
      ListEmptyComponent={
        <Card variant="outlined" className="items-center gap-lg !rounded-2xl !border-catalog-line !px-xxxl !py-12">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-catalog-muted">
            <Shirt size={36} color={COLORS.catalogMutedText} />
          </View>
          <Text className="text-center font-sans text-headline-md font-bold text-primary-container">Tủ đồ đang trống</Text>
          <Text className="text-center font-sans text-body-sm leading-relaxed text-catalog-muted-text">Lưu những sản phẩm bạn yêu thích từ trang chi tiết để xem lại tại đây.</Text>
          <Button title="Khám phá sản phẩm" size="sm" className="!rounded-xl" textClassName="font-sans !text-on-primary" onPress={() => navigation.navigate('ShopTab')} />
        </Card>
      }
    />
  );
};
