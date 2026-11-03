import React, { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
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
      <View className="flex-1 items-center justify-center gap-3 bg-landing-paper">
        <ActivityIndicator color={COLORS.oxblood} />
        <Text className="font-sans text-body-sm text-landing-muted">
          Đang tải lịch sử tư vấn…
        </Text>
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
      className="flex-1 bg-landing-paper"
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
        <View className="gap-3 border-b border-landing-line px-lg pb-5 pt-lg">
          <View className="flex-row items-center gap-2">
            <Sparkles size={14} strokeWidth={1.75} color={COLORS.brassInk} />
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
              AI Stylist
            </Text>
          </View>
          <View className="flex-row items-end justify-between gap-3">
            <Text
              accessibilityRole="header"
              className="flex-1 font-display text-headline-lg text-landing-obsidian"
            >
              Lịch sử tư vấn
            </Text>
            <Text className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-landing-muted">
              {String(historyQuery.data?.pages[0]?.meta.total ?? results.length).padStart(2, '0')} kết quả
            </Text>
          </View>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Xem lại những lần tư vấn phong cách đã thực hiện với AI.
          </Text>
          {historyQuery.isError ? (
            <Text
              accessibilityRole="alert"
              className="border-l-2 border-brass bg-ivory px-4 py-3 font-sans text-body-sm text-landing-muted"
            >
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
        <View className="mx-lg items-center gap-5 border border-dashed border-taupe bg-ivory px-6 py-14">
          <View className="h-16 w-16 items-center justify-center border border-landing-line">
            <Sparkles size={24} strokeWidth={1.5} color={COLORS.oxblood} />
          </View>
          <View className="gap-2">
            <Text className="text-center font-display text-[20px] text-landing-obsidian">
              Chưa có lịch sử tư vấn
            </Text>
            <Text className="text-center font-sans text-body-sm leading-relaxed text-landing-muted">
              Kết quả AI Stylist của bạn sẽ được lưu tại đây để xem lại bất cứ lúc nào.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Stylist')}
            className="h-11 items-center justify-center rounded-subtle bg-oxblood px-5 active:opacity-90"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              Tạo tư vấn mới
            </Text>
          </Pressable>
        </View>
      }
      ListFooterComponent={
        historyQuery.isFetchingNextPage ? (
          <View className="py-lg">
            <ActivityIndicator color={COLORS.oxblood} />
          </View>
        ) : null
      }
    />
  );
}
