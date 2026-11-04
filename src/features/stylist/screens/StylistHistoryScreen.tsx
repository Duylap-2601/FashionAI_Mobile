import React, { useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { StylistHistoryCard } from '../components/StylistHistoryCard';
import { StylistStatePanel } from '../components/StylistStatePanel';
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
        'Kết quả và các bộ phối gợi ý sẽ bị xóa khỏi lịch sử.',
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
      <View
        accessibilityRole="progressbar"
        className="flex-1 items-center justify-center gap-3 bg-landing-paper"
      >
        <ActivityIndicator size="large" color={COLORS.oxblood} />
        <Text className="font-sans text-body-sm text-landing-muted">
          Đang tải lịch sử tư vấn…
        </Text>
      </View>
    );
  }

  if (historyQuery.isError && results.length === 0) {
    return (
      <StylistStatePanel
        fullscreen
        title="Không tải được lịch sử"
        description="Kiểm tra kết nối rồi thử lại."
        actionLabel="Thử lại"
        onAction={() => void historyQuery.refetch()}
      />
    );
  }

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />
      <FlatList
        className="flex-1"
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
          <View className="gap-4 border-b border-landing-line px-lg pb-5 pt-lg">
            <BackButton label="Quay lại" onPress={() => navigation.goBack()} />
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
                {historyQuery.data?.pages[0]?.meta.total ?? results.length} lần tư vấn
              </Text>
            </View>
            <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
              Các lần tư vấn phối đồ bạn đã nhận, kèm bộ phối từ sản phẩm trong cửa hàng.
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
          <View className="mx-lg">
            <StylistStatePanel
              title="Chưa có lần tư vấn nào"
              description="AI Stylist xem ảnh và mô tả của bạn rồi gợi ý bộ phối từ sản phẩm trong cửa hàng."
              actionLabel="Nhờ AI Stylist"
              actionVariant="primary"
              onAction={() => navigation.navigate('Stylist')}
            />
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
    </View>
  );
}
