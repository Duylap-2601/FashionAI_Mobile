import React, { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
      <View className="flex-1 items-center justify-center bg-catalog-muted">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md font-sans text-body-sm text-catalog-muted-text">Đang tải lịch sử tư vấn...</Text>
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
      className="flex-1 bg-catalog-muted"
      data={results}
      keyExtractor={(item) => item.id}
      contentContainerClassName="flex-grow gap-lg pb-xxxl"
      contentInsetAdjustmentBehavior="automatic"
      refreshing={historyQuery.isRefetching && !historyQuery.isFetchingNextPage}
      onRefresh={() => void historyQuery.refetch()}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View className="gap-lg px-lg pt-xxl pb-sm">
          <View className="flex-row flex-wrap items-center gap-sm">
            <Text accessibilityRole="header" className="font-sans text-headline-lg font-bold text-on-surface-strong">Lịch sử AI Stylist</Text>
            <Text className="rounded-full bg-surface-high px-md py-xs font-sans text-body-sm text-on-surface-variant">
              {historyQuery.data?.pages[0]?.meta.total ?? results.length}
            </Text>
          </View>
          <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">Xem lại những lần tư vấn phong cách đã thực hiện với AI.</Text>
          {historyQuery.isError ? (
          <Text accessibilityRole="alert" className="rounded-xl border border-catalog-line bg-surface-lowest p-lg font-sans text-body-sm text-danger">
            Chưa thể cập nhật lịch sử mới nhất. Nội dung đã tải vẫn được giữ lại.
          </Text>
          ) : null}
        </View>
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
        <Card variant="outlined" className="mx-lg items-center gap-xl !rounded-2xl border-dashed !border-catalog-line !px-xxl !py-12">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-container/5">
            <Sparkles size={32} color={COLORS.primaryContainer} />
          </View>
          <View className="gap-md">
            <Text className="text-center font-sans text-headline-md font-semibold text-on-surface-strong">Chưa có lịch sử tư vấn</Text>
            <Text className="text-center font-sans text-body-md leading-relaxed text-catalog-muted-text">Kết quả AI Stylist của bạn sẽ được lưu tại đây để xem lại bất cứ lúc nào.</Text>
          </View>
          <Button title="Tạo tư vấn mới" className="!rounded-xl" textClassName="font-sans !text-body-sm !text-on-primary" onPress={() => navigation.navigate('Stylist')} />
        </Card>
      }
      ListFooterComponent={
        historyQuery.isFetchingNextPage ? (
          <ActivityIndicator className="py-lg" color={COLORS.primaryContainer} />
        ) : null
      }
    />
  );
}
