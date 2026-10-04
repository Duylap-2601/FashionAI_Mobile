import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { StylistResultContent } from '../components/StylistResultContent';
import { useStylistResult } from '../hooks/useStylist';

type Props = NativeStackScreenProps<RootStackParamList, 'StylistResult'>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Chưa thể tải kết quả tư vấn. Vui lòng thử lại.';
}

export function StylistResultScreen({ navigation, route }: Props) {
  const resultId = route.params.resultId.trim();
  const resultQuery = useStylistResult(resultId);
  const result = resultQuery.data;

  if (!resultId) {
    return (
      <ErrorView
        fullscreen
        title="Không thể mở kết quả"
        message="Mã kết quả tư vấn không hợp lệ."
      />
    );
  }

  if (resultQuery.isLoading && !result) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-body-sm text-on-surface-variant">Đang tải kết quả tư vấn...</Text>
      </View>
    );
  }

  if (resultQuery.error instanceof ApiError && resultQuery.error.statusCode === 404) {
    return (
      <EmptyState
        fullscreen
        icon="✦"
        title="Không tìm thấy kết quả"
        description="Kết quả tư vấn có thể đã được xóa."
        actionTitle="Xem lịch sử"
        onAction={() => navigation.replace('StylistHistory')}
      />
    );
  }

  if (resultQuery.isError && !result) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải kết quả"
        message={getErrorMessage(resultQuery.error)}
        onRetry={() => void resultQuery.refetch()}
      />
    );
  }

  if (!result) {
    return (
      <ErrorView fullscreen message="Kết quả tư vấn chưa sẵn sàng." />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="gap-md px-lg py-xl"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={resultQuery.isRefetching}
          colors={[COLORS.primaryContainer]}
          tintColor={COLORS.primaryContainer}
          onRefresh={() => void resultQuery.refetch()}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {resultQuery.isError ? (
        <Text accessibilityRole="alert" className="rounded-lg bg-surface-low p-md text-body-sm text-danger">
          Chưa thể cập nhật kết quả mới nhất. Nội dung đã tải vẫn được giữ lại.
        </Text>
      ) : null}
      <StylistResultContent
        result={result}
        onProductPress={(productId) => navigation.navigate('ProductDetail', { productId })}
      />
    </ScrollView>
  );
}
