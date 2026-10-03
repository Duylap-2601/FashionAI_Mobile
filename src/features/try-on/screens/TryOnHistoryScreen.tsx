import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '@/navigation/types';
import { useTryOnHistory } from '@/features/try-on/hooks/use-try-on-history';
import { useTryOnDelete } from '@/features/try-on/hooks/use-try-on-delete';
import {
  TryOnCategory,
  TryOnResult,
} from '@/features/try-on/types/try-on';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { EmptyState } from '@/components/common/EmptyState';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { formatDate } from '@/utils/date';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnHistory'>;

const CATEGORY_LABELS: Record<TryOnCategory, string> = {
  UPPER: 'Áo',
  LOWER: 'Quần/Váy',
  FULL_BODY: 'Nguyên bộ',
};

const HistoryCard: React.FC<{ item: TryOnResult; onPress: () => void }> = ({
  item,
  onPress,
}) => (
  <Pressable className="mb-lg flex-1 px-sm" onPress={onPress}>
    <View className="overflow-hidden rounded-xl border border-surface-line bg-surface-lowest shadow-sm">
      {/* NativeWind không có token aspect 3:4 nên dùng aspectRatio tính toán */}
      <Image
        source={{ uri: item.resultUrl }}
        style={{ aspectRatio: 3 / 4 }}
        className="w-full"
        contentFit="cover"
        transition={300}
      />
      <View className="p-md">
        <View className="mb-xs self-start rounded-full bg-primary-soft px-md py-xs">
          <Text className="text-label-md text-primary-container">
            {CATEGORY_LABELS[item.category]}
          </Text>
        </View>
        <Text className="text-body-sm text-on-surface-variant">
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  </Pressable>
);

export const TryOnHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTryOnHistory();
  const { removeAll } = useTryOnDelete();
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const items = data?.pages.flat() ?? [];

  const renderItem = ({ item }: ListRenderItemInfo<TryOnResult>) => (
    <HistoryCard
      item={item}
      onPress={() => navigation.navigate('TryOnDetail', { id: item.id })}
    />
  );

  if (isLoading) {
    return <Loading fullscreen message="Đang tải lịch sử thử đồ..." />;
  }

  if (isError) {
    return (
      <ErrorView
        fullscreen
        title="Không tải được lịch sử"
        message="Vui lòng kiểm tra kết nối mạng và thử lại."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        className="px-md pt-xl"
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          items.length > 0 ? (
            <View className="mb-md items-end">
              <Pressable
                className="min-h-11 justify-center px-sm"
                onPress={() => setShowDeleteAllModal(true)}
              >
                <Text className="text-label-lg text-danger">Xóa tất cả</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="👗"
            title="Chưa có lịch sử thử đồ"
            description="Kết quả các lần thử đồ AI của bạn sẽ hiện ở đây."
            actionTitle="Thử đồ ngay"
            onAction={() => navigation.navigate('TryOnHome')}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? <Loading message="Đang tải thêm..." /> : null
        }
      />

      <FeedbackModal
        visible={showDeleteAllModal}
        onClose={() => {
          if (!removeAll.isPending) setShowDeleteAllModal(false);
        }}
        type="warning"
        title="Xóa toàn bộ lịch sử?"
        message="Toàn bộ kết quả thử đồ của bạn sẽ bị xóa và không thể khôi phục."
        primaryButtonText="Xóa tất cả"
        primaryButtonVariant="danger"
        primaryButtonLoading={removeAll.isPending}
        onPrimaryPress={() =>
          removeAll.mutate(undefined, {
            onSuccess: () => setShowDeleteAllModal(false),
          })
        }
        secondaryButtonText="Hủy"
        secondaryButtonDisabled={removeAll.isPending}
      />
    </View>
  );
};

export default TryOnHistoryScreen;
