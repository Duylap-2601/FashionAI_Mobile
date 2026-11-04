import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { StylistResultContent } from '../components/StylistResultContent';
import { StylistStatePanel } from '../components/StylistStatePanel';
import { useStylistResult } from '../hooks/useStylist';

type Props = NativeStackScreenProps<RootStackParamList, 'StylistResult'>;

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Chưa thể tải kết quả tư vấn. Vui lòng thử lại.';
}

/** AppHeader + nút quay lại như màn lịch sử AI Stylist; mọi trạng thái đều có đường quay lại. */
function ResultShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />
      <View className="px-lg pt-4">
        <BackButton label="AI Stylist" onPress={onBack} />
      </View>
      {children}
    </View>
  );
}

export function StylistResultScreen({ navigation, route }: Props) {
  const goBack = () => navigation.goBack();
  return (
    <ResultShell onBack={goBack}>
      <StylistResultBody navigation={navigation} route={route} />
    </ResultShell>
  );
}

function StylistResultBody({ navigation, route }: Props) {
  const resultId = route.params.resultId.trim();
  const resultQuery = useStylistResult(resultId);
  const result = resultQuery.data;

  if (!resultId) {
    return (
      <StylistStatePanel
        fullscreen
        title="Không thể mở kết quả"
        description="Mã kết quả tư vấn không hợp lệ."
      />
    );
  }

  if (resultQuery.isLoading && !result) {
    return (
      <View
        accessibilityRole="progressbar"
        className="flex-1 items-center justify-center gap-3 bg-landing-paper"
      >
        <ActivityIndicator size="large" color={COLORS.oxblood} />
        <Text className="font-sans text-body-sm text-landing-muted">
          Đang tải kết quả tư vấn…
        </Text>
      </View>
    );
  }

  if (resultQuery.error instanceof ApiError && resultQuery.error.statusCode === 404) {
    return (
      <StylistStatePanel
        fullscreen
        title="Không tìm thấy kết quả"
        description="Kết quả tư vấn có thể đã được xóa."
        actionLabel="Xem lịch sử"
        onAction={() => navigation.replace('StylistHistory')}
      />
    );
  }

  if (resultQuery.isError && !result) {
    return (
      <StylistStatePanel
        fullscreen
        title="Chưa thể tải kết quả"
        description={getErrorMessage(resultQuery.error)}
        actionLabel="Thử lại"
        onAction={() => void resultQuery.refetch()}
      />
    );
  }

  if (!result) {
    return <StylistStatePanel fullscreen title="Kết quả tư vấn chưa sẵn sàng" />;
  }

  return (
    <ScrollView
      className="flex-1 bg-landing-paper"
      contentContainerClassName="gap-xl px-lg pb-xxxl pt-lg"
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
