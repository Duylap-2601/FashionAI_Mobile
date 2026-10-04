import React, { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { StylistHistoryCard } from '../components/StylistHistoryCard';
import {
  useDeleteStylistHistoryItem,
  useStylistHistory,
} from '../hooks/useStylist';
import type { IStylistResult } from '../types/stylist';

type Props = NativeStackScreenProps<RootStackParamList, 'StylistHistory'>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function StylistHistoryScreen({ navigation }: Props) {
  const historyQuery = useStylistHistory();
  const deleteMutation = useDeleteStylistHistoryItem();
  const results = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [historyQuery.data],
  );

  const loadMore = useCallback(() => {
    if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
      void historyQuery.fetchNextPage();
    }
  }, [historyQuery]);

  const confirmDelete = useCallback(
    (result: IStylistResult) => {
      Alert.alert(
        'Xóa kết quả tư vấn?',
        'Kết quả đã xóa không thể khôi phục.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: () => {
              void deleteMutation.mutateAsync(result.id).catch((error: unknown) => {
                Alert.alert('Không thể xóa kết quả', getErrorMessage(error));
              });
            },
          },
        ],
      );
    },
    [deleteMutation],
  );

  if (historyQuery.isLoading && results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md text-body-sm text-on-surface-variant">Đang tải lịch sử tư vấn...</Text>
      </View>
    );
  }

  if (historyQuery.isError && results.length === 0) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải lịch sử tư vấn"
        message={getErrorMessage(historyQuery.error)}
        onRetry={() => void historyQuery.refetch()}
      />
    );
  }

  return (
    <FlatList
      className="flex-1 bg-surface"
      data={results}
      keyExtractor={(item) => item.id}
      contentContainerClassName="flex-grow gap-md pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={historyQuery.isRefetching && !historyQuery.isFetchingNextPage}
      onRefresh={() => void historyQuery.refetch()}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        historyQuery.isError ? (
          <Text accessibilityRole="alert" className="mx-lg mt-lg rounded-lg bg-surface-low p-md text-body-sm text-danger">
            Chưa thể cập nhật lịch sử mới nhất. Nội dung đã tải vẫn được giữ lại.
          </Text>
        ) : (
          <View className="h-lg" />
        )
      }
      renderItem={({ item }) => (
        <StylistHistoryCard
          result={item}
          deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
          onOpen={(resultId) => navigation.navigate('StylistResult', { resultId })}
          onDelete={confirmDelete}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="✦"
          title="Chưa có lịch sử tư vấn"
          description="Kết quả AI Stylist của bạn sẽ được lưu tại đây."
          actionTitle="Tạo tư vấn mới"
          onAction={() => navigation.navigate('Stylist')}
        />
      }
      ListFooterComponent={
        historyQuery.isFetchingNextPage ? (
          <ActivityIndicator className="py-lg" color={COLORS.primaryContainer} />
        ) : null
      }
    />
  );
}
