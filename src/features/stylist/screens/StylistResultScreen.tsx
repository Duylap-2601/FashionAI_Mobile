import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
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
      <View className="flex-1 items-center justify-center gap-3 bg-landing-paper">
        <ActivityIndicator color={COLORS.oxblood} />
        <Text className="font-sans text-body-sm text-landing-muted">
          Đang tải kết quả tư vấn…
        </Text>
      </View>
    );
  }

  if (resultQuery.error instanceof ApiError && resultQuery.error.statusCode === 404) {
    return (
      <View className="flex-1 justify-center bg-landing-paper p-lg">
        <View className="items-center gap-5 rounded-subtle border border-landing-line bg-ivory px-6 py-12">
          <View className="h-16 w-16 items-center justify-center border border-landing-line">
            <Sparkles size={24} strokeWidth={1.5} color={COLORS.oxblood} />
          </View>
          <Text className="text-center font-display text-[20px] text-landing-obsidian">
            Không tìm thấy kết quả
          </Text>
          <Text className="text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            Kết quả tư vấn có thể đã được xóa.
          </Text>
          <Text
            accessibilityRole="button"
            className="h-10 px-4 font-sans text-[11px] font-semibold uppercase leading-10 tracking-[0.16em] text-oxblood"
            onPress={() => navigation.replace('StylistHistory')}
          >
            Xem lịch sử
          </Text>
        </View>
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
    return <ErrorView fullscreen message="Kết quả tư vấn chưa sẵn sàng." />;
  }

  return (
    <ScrollView
      className="flex-1 bg-landing-paper"
      contentContainerClassName="gap-xl px-lg pb-xxxl pt-lg"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={resultQuery.isRefetching}
          colors={[COLORS.oxblood]}
          tintColor={COLORS.oxblood}
          onRefresh={() => void resultQuery.refetch()}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {resultQuery.isError ? (
        <Text
          accessibilityRole="alert"
          className="border-l-2 border-brass bg-ivory px-4 py-3 font-sans text-body-sm text-landing-muted"
        >
          Chưa thể cập nhật kết quả mới nhất. Nội dung đã tải vẫn được giữ lại.
        </Text>
      ) : null}

      <View className="gap-2 border-b border-landing-line pb-5">
        <View className="flex-row items-center gap-2">
          <Sparkles size={14} strokeWidth={1.75} color={COLORS.brassInk} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
            AI Stylist
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          className="font-display text-headline-lg text-landing-obsidian"
        >
          Kết quả tư vấn
        </Text>
        <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
          Phân tích màu sắc, vóc dáng và gợi ý phối đồ của bạn.
        </Text>
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
