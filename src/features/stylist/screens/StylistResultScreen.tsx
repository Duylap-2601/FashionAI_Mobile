import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
      <View className="flex-1 items-center justify-center gap-md bg-catalog-muted">
        <ActivityIndicator color={COLORS.primaryContainer} />
        <Text className="font-sans text-body-sm text-catalog-muted-text">Đang tải kết quả tư vấn...</Text>
      </View>
    );
  }

  if (resultQuery.error instanceof ApiError && resultQuery.error.statusCode === 404) {
    return (
      <View className="flex-1 justify-center bg-catalog-muted p-lg">
        <Card variant="outlined" className="items-center gap-xl !rounded-2xl !border-catalog-line !p-xxxl">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-catalog-muted">
            <Sparkles size={28} color={COLORS.primaryContainer} />
          </View>
          <Text className="text-center font-sans text-headline-md font-semibold text-primary-container">Không tìm thấy kết quả</Text>
          <Text className="text-center font-sans text-body-sm leading-relaxed text-catalog-muted-text">Kết quả tư vấn có thể đã được xóa.</Text>
          <Button title="Xem lịch sử" className="!rounded-xl" textClassName="font-sans !text-body-sm !text-on-primary" onPress={() => navigation.replace('StylistHistory')} />
        </Card>
      </View>
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
      className="flex-1 bg-catalog-muted"
      contentContainerClassName="gap-xxl px-lg pb-xxxl pt-xxl"
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
        <Text accessibilityRole="alert" className="rounded-xl border border-catalog-line bg-surface-lowest p-lg font-sans text-body-sm text-danger">
          Chưa thể cập nhật kết quả mới nhất. Nội dung đã tải vẫn được giữ lại.
        </Text>
      ) : null}
      <View className="gap-sm">
        <Text accessibilityRole="header" className="font-sans text-headline-lg font-bold text-primary-container">Kết quả tư vấn</Text>
        <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">Phân tích màu sắc, vóc dáng và gợi ý phối đồ của bạn.</Text>
      </View>
      <StylistResultContent
        result={result}
        onProductPress={(productId) => navigation.navigate('ProductDetail', { productId })}
        onTryOnPress={(product) => {
          navigation.navigate('Main', {
            screen: 'TryOnTab',
            params: {
              screen: 'TryOnHome',
              params: product
                ? {
                    productId: product.id,
                    productName: product.name,
                    productImageUrl: product.imageUrl,
                  }
                : undefined,
            },
          });
        }}
      />
    </ScrollView>
  );
}
