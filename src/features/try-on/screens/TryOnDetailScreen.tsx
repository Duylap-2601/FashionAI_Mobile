import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Download, Trash2, Zap } from 'lucide-react-native';
import { TryOnStackParamList } from '@/navigation/types';
import { tryOnApi } from '@/features/try-on/api/try-on.api';
import { useTryOnDelete } from '@/features/try-on/hooks/use-try-on-delete';
import { TryOnCategory } from '@/features/try-on/types/try-on';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { COLORS } from '@/constants/theme';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { TRY_ON_LABEL_CLASS } from '../components/TryOnHeader';
import { formatDateTime } from '@/utils/date';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnDetail'>;

// Cùng nhãn loại trang phục với FE (profile-history-page.tsx).
const CATEGORY_LABELS: Record<TryOnCategory, string> = {
  UPPER: 'Áo',
  LOWER: 'Quần & váy',
  FULL_BODY: 'Đồ liền',
};

const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';
// expo-image không nhận className nên kích thước ảnh thu nhỏ nằm ở style.
const THUMB_IMAGE_STYLE = { width: '100%', height: '100%' } as const;

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
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={COLORS.oxblood} />
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            Đang tải chi tiết
          </Text>
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 bg-landing-paper">
        <AppHeader />
        <View accessibilityRole="alert" className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center font-display text-[22px] leading-tight text-landing-obsidian">
            Không tải được chi tiết
          </Text>
          <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
            Kết quả này có thể đã bị xoá. Vui lòng thử lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử lại"
            onPress={() => refetch()}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-lg pb-giant pt-lg"
        showsVerticalScrollIndicator={false}
      >
        <BackButton onPress={() => navigation.goBack()} label="Quay lại" />

        <View className="mb-6 mt-4 border-b border-landing-line pb-5">
          <Text className={TRY_ON_LABEL_CLASS}>Lịch sử thử đồ</Text>
          <Text
            accessibilityRole="header"
            className="mt-2 font-display text-headline-lg text-landing-obsidian"
          >
            Chi tiết thử đồ
          </Text>
          <Text className="mt-2 font-mono text-[11px] text-landing-muted">
            {formatDateTime(data.createdAt)}
          </Text>
        </View>

        {data.humanImageUrl ? (
          <View className="mb-4 flex-row items-baseline justify-between gap-4">
            <Text className="font-display text-[22px] leading-tight text-landing-obsidian">Kết quả</Text>
            <Text className="font-sans text-[11px] text-landing-muted">Kéo để so sánh trước và sau</Text>
          </View>
        ) : null}
        <ComparisonSlider before={data.humanImageUrl} after={data.resultUrl} />

        <View className="mt-8 rounded-subtle border border-landing-line bg-ivory">
          <View className="flex-row items-end justify-between gap-3 border-b border-landing-line px-4 py-3.5">
            <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
              Trang phục đã thử
            </Text>
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
              {CATEGORY_LABELS[data.category]}
            </Text>
          </View>

          <View className="gap-4 px-4 py-4">
            {data.product ? (
              <View className="flex-row items-center gap-3">
                {data.product.imageUrl ? (
                  <View className="h-16 w-12 overflow-hidden rounded-subtle border border-landing-line bg-landing-paper">
                    <Image
                      source={{ uri: data.product.imageUrl }}
                      style={THUMB_IMAGE_STYLE}
                      contentFit="cover"
                      accessibilityLabel={data.product.name}
                    />
                  </View>
                ) : null}
                <Text
                  numberOfLines={2}
                  className="flex-1 font-sans text-sm font-medium leading-snug text-landing-obsidian"
                >
                  {data.product.name}
                </Text>
              </View>
            ) : null}

            {data.garments.length > 0 ? (
              <View className="flex-row flex-wrap gap-3">
                {data.garments.map((garment, index) => (
                  <View key={`${garment.productId ?? 'upload'}-${index}`} className="items-center gap-1.5">
                    {garment.imageUrl ? (
                      <View className="h-16 w-12 overflow-hidden rounded-subtle border border-landing-line bg-landing-paper">
                        <Image
                          source={{ uri: garment.imageUrl }}
                          style={THUMB_IMAGE_STYLE}
                          contentFit="cover"
                          accessibilityLabel={CATEGORY_LABELS[garment.category]}
                        />
                      </View>
                    ) : null}
                    <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
                      {CATEGORY_LABELS[garment.category]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {data.isCacheHit ? (
              <View className="flex-row items-center gap-2 border-t border-landing-line pt-3">
                <Zap size={13} strokeWidth={1.75} color={COLORS.brassInk} />
                <Text className="font-sans text-body-sm text-landing-muted">Lấy từ kết quả đã lưu</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mt-8 gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tải về máy"
            accessibilityState={{ disabled: isDownloading, busy: isDownloading }}
            disabled={isDownloading}
            onPress={handleDownload}
            className={`h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood ${
              isDownloading ? 'opacity-50' : 'active:opacity-90'
            }`}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={COLORS.paper} />
            ) : (
              <Download size={15} strokeWidth={1.75} color={COLORS.paper} />
            )}
            <Text className={`${ACTION_LABEL_CLASS} text-landing-paper`}>Tải về máy</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử món khác"
            onPress={() => navigation.navigate('TryOnHome')}
            className="h-12 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Thử món khác</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xoá khỏi lịch sử"
            onPress={() => setShowDeleteModal(true)}
            className="h-12 flex-row items-center justify-center gap-2 rounded-subtle border border-danger/40 active:opacity-70"
          >
            <Trash2 size={15} strokeWidth={1.75} color={COLORS.danger} />
            <Text className={`${ACTION_LABEL_CLASS} text-danger`}>Xoá khỏi lịch sử</Text>
          </Pressable>
        </View>

        <FeedbackModal
          visible={showDeleteModal}
          onClose={() => {
            if (!remove.isPending) setShowDeleteModal(false);
          }}
          type="warning"
          title="Xoá kết quả này?"
          message="Ảnh kết quả sẽ bị xoá khỏi lịch sử và không khôi phục được."
          primaryButtonText="Xoá"
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
          secondaryButtonText="Giữ lại"
          secondaryButtonDisabled={remove.isPending}
        />
      </ScrollView>
    </View>
  );
};

export default TryOnDetailScreen;
