import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TryOnStackParamList } from '@/navigation/types';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { useTryOnDelete } from '@/features/try-on/hooks/use-try-on-delete';
import { TryOnCategory } from '@/features/try-on/types/try-on';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { Button } from '@/components/ui/Button';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { formatDateTime } from '@/utils/date';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnDetail'>;

const CATEGORY_LABELS: Record<TryOnCategory, string> = {
  UPPER: 'Áo',
  LOWER: 'Quần/Váy',
  FULL_BODY: 'Nguyên bộ',
};

export const TryOnDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { remove } = useTryOnDelete();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['try-on-detail', id],
    queryFn: ({ signal }) => tryOnApi.getDetail(id, { signal }),
  });

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await tryOnApi.downloadResult(id);
      Alert.alert('Đã lưu ảnh', 'Ảnh kết quả thử đồ đã được lưu vào thư viện của bạn.');
    } catch (err: any) {
      Alert.alert('Tải ảnh thất bại', err.message || 'Không thể tải ảnh kết quả.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <Loading fullscreen message="Đang tải chi tiết..." />;
  }

  if (isError || !data) {
    return (
      <ErrorView
        fullscreen
        title="Không tải được chi tiết"
        message="Kết quả này có thể đã bị xóa. Vui lòng thử lại."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-xl">
      <View className="overflow-hidden rounded-xl border border-surface-line bg-surface-lowest shadow-sm">
        {/* NativeWind không có token aspect 3:4 nên dùng aspectRatio tính toán */}
        <Image
          source={{ uri: data.resultUrl }}
          style={{ aspectRatio: 3 / 4 }}
          className="w-full"
          contentFit="cover"
          transition={300}
        />
      </View>

      <View className="mt-xl rounded-xl border border-surface-line bg-surface-lowest p-lg shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="rounded-full bg-primary-soft px-md py-xs">
            <Text className="text-label-md text-primary-container">
              {CATEGORY_LABELS[data.category]}
            </Text>
          </View>
          {data.isCacheHit ? (
            <Text className="text-body-sm text-on-surface-variant">
              Lấy từ kết quả đã lưu
            </Text>
          ) : null}
        </View>
        <Text className="mt-sm text-body-sm text-on-surface-variant">
          {formatDateTime(data.createdAt)}
        </Text>

        {data.garments.length > 0 ? (
          <View className="mt-md">
            <Text className="mb-sm text-body-sm font-semibold text-on-surface">
              Trang phục đã thử
            </Text>
            <View className="flex-row gap-md">
              {data.garments.map((garment, index) => (
                <View key={`${garment.productId ?? 'upload'}-${index}`} className="items-center">
                  {garment.imageUrl ? (
                    <Image
                      source={{ uri: garment.imageUrl }}
                      className="h-16 w-12 rounded-md"
                      contentFit="cover"
                    />
                  ) : null}
                  <Text className="mt-xs text-body-sm text-on-surface-variant">
                    {CATEGORY_LABELS[garment.category]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {data.product ? (
          <View className="mt-md flex-row items-center gap-md">
            {data.product.imageUrl ? (
              <Image
                source={{ uri: data.product.imageUrl }}
                className="h-16 w-12 rounded-md"
                contentFit="cover"
              />
            ) : null}
            <Text className="flex-1 text-body-sm font-semibold text-on-surface">
              {data.product.name}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-xl">
        <Button
          title="Tải về máy"
          onPress={handleDownload}
          loading={isDownloading}
          textClassName="text-primary-foreground"
        />
        <Button
          className="mt-md"
          title="Thử món khác"
          variant="outline"
          onPress={() => navigation.navigate('TryOnHome')}
        />
        <TouchableOpacity
          className="mt-md min-h-11 items-center justify-center rounded-lg border border-outline-variant py-md"
          onPress={() => setShowDeleteModal(true)}
        >
          <Text className="text-body-sm font-bold text-danger">Xóa khỏi lịch sử</Text>
        </TouchableOpacity>
      </View>

      <FeedbackModal
        visible={showDeleteModal}
        onClose={() => {
          if (!remove.isPending) setShowDeleteModal(false);
        }}
        type="warning"
        title="Xóa kết quả này?"
        message="Kết quả thử đồ sẽ bị xóa khỏi lịch sử và không thể khôi phục."
        primaryButtonText="Xóa"
        primaryButtonVariant="danger"
        primaryButtonLoading={remove.isPending}
        onPrimaryPress={() =>
          remove.mutate(id, {
            onSuccess: () => {
              setShowDeleteModal(false);
              navigation.goBack();
            },
          })
        }
        secondaryButtonText="Hủy"
        secondaryButtonDisabled={remove.isPending}
      />
    </ScrollView>
  );
};

export default TryOnDetailScreen;
