import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQuery } from '@tanstack/react-query';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, TryOnStackParamList } from '@/navigation/types';
import { liveTryOnApi } from '@/features/try-on/api/live-try-on.api';
import { useLiveTryOn } from '@/features/try-on/hooks/use-live-try-on';
import { Loading } from '@/components/common/Loading';
import { ErrorView } from '@/components/common/ErrorView';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TryOnHeader } from '@/features/try-on/components/TryOnHeader';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnLive'>;

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const TryOnLiveScreen: React.FC<Props> = ({ navigation, route }) => {
  const productId = route.params?.productId;
  const [permission, requestPermission] = useCameraPermissions();
  const [showEndModal, setShowEndModal] = useState(false);
  const { phase, remainingSeconds, error, start, pause, resume, end } =
    useLiveTryOn();

  const quotaQuery = useQuery({
    queryKey: ['live-try-on-quota'],
    queryFn: () => liveTryOnApi.getQuota(),
  });

  const garmentQuery = useQuery({
    queryKey: ['live-try-on-garment', productId],
    queryFn: () => liveTryOnApi.checkGarment(productId as string),
    enabled: !!productId,
  });

  // Đóng phiên còn dở khi rời màn hình để không treo session phía server.
  useEffect(() => {
    return () => {
      end('screen_exit');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!permission) {
    return <Loading fullscreen message="Đang kiểm tra quyền camera..." />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background">
        <ErrorView
          fullscreen
          title="Cần quyền camera"
          message="FashionAI cần quyền camera để bạn thử đồ trực tiếp. Vui lòng cho phép để tiếp tục."
          onRetry={() => requestPermission()}
        />
      </View>
    );
  }

  if (!productId) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          fullscreen
          icon="👗"
          title="Chưa chọn sản phẩm"
          description="Hãy chọn một sản phẩm hỗ trợ thử trực tiếp từ màn Khám phá."
          actionTitle="Đi tới Khám phá"
          onAction={() =>
            navigation
              .getParent<BottomTabNavigationProp<MainTabParamList>>()
              ?.navigate('ShopTab')
          }
        />
      </View>
    );
  }

  const quota = quotaQuery.data;
  const garmentSupported = garmentQuery.data?.supported ?? true;
  const canStart =
    phase === 'idle' &&
    !quotaQuery.isLoading &&
    !!quota?.eligible &&
    garmentSupported;

  const phaseLabel =
    phase === 'starting'
      ? 'Đang tạo phiên...'
      : phase === 'active'
        ? 'Đang trực tiếp'
        : phase === 'paused'
          ? 'Đã tạm dừng'
          : phase === 'ending'
            ? 'Đang kết thúc...'
            : phase === 'ended'
              ? 'Phiên đã kết thúc'
              : '';

  return (
    <View className="flex-1 bg-background">
      <TryOnHeader />
      <ScrollView className="flex-1" contentContainerClassName="p-xl">
      <View>
        <SegmentedControl
          options={[
            { value: 'photo', label: 'Thử bằng ảnh' },
            { value: 'live', label: 'Live Try-on' },
          ]}
          value="live"
          onChange={(next) => {
            if (next === 'photo') navigation.navigate('TryOnHome');
          }}
        />
      </View>
      <View className="overflow-hidden rounded-xl border border-surface-line bg-surface-lowest shadow-sm">
        <View className="h-80">
          {/* CameraView là native view của bên thứ ba nên dùng style trực tiếp */}
          <CameraView style={{ flex: 1 }} facing="front" />
          <View className="absolute left-md top-md rounded-full bg-inverse-surface px-md py-xs">
            <Text className="text-body-sm font-semibold text-inverse-on-surface">
              {phaseLabel || 'Thử đồ trực tiếp'}
            </Text>
          </View>
          {phase === 'active' && remainingSeconds > 0 ? (
            <View className="absolute right-md top-md rounded-full bg-inverse-surface px-md py-xs">
              <Text className="text-body-sm font-semibold text-inverse-on-surface">
                {formatSeconds(remainingSeconds)}
              </Text>
            </View>
          ) : null}
          {phase === 'paused' ? (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <Text className="text-body-lg font-bold text-inverse-on-surface">
                Phiên đang tạm dừng
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="mt-xl rounded-xl border border-surface-line bg-surface-lowest p-lg shadow-sm">
        {route.params?.productName ? (
          <Text className="text-body-sm font-semibold text-on-surface">
            {route.params.productName}
          </Text>
        ) : null}
        {quotaQuery.data ? (
          <Text className="mt-xs text-body-sm text-on-surface-variant">
            Còn {quotaQuery.data.remaining} giây thử trực tiếp
          </Text>
        ) : null}
        {!garmentSupported ? (
          <Text className="mt-xs text-body-sm text-danger">
            Sản phẩm này hiện chưa hỗ trợ thử trực tiếp.
          </Text>
        ) : null}
        {error ? (
          <Text className="mt-xs text-body-sm text-danger">{error}</Text>
        ) : null}
      </View>

      <View className="mt-xl">
        {phase === 'idle' ||
        phase === 'starting' ||
        phase === 'error' ||
        phase === 'ended' ? (
          <Button
            title={phase === 'idle' || phase === 'starting' ? 'Bắt đầu thử đồ' : 'Thử lại'}
            onPress={() => start(productId)}
            loading={phase === 'starting'}
            disabled={phase === 'starting' || (!canStart && phase === 'idle')}
            textClassName="text-primary-foreground"
          />
        ) : null}
        {phase === 'active' ? (
          <View className="flex-row gap-md">
            <View className="flex-1">
              <Button title="Tạm dừng" variant="outline" onPress={() => pause()} />
            </View>
            <View className="flex-1">
              <Button
                title="Kết thúc"
                onPress={() => setShowEndModal(true)}
                textClassName="text-primary-foreground"
              />
            </View>
          </View>
        ) : null}
        {phase === 'paused' ? (
          <View className="flex-row gap-md">
            <View className="flex-1">
              <Button
                title="Tiếp tục"
                onPress={() => resume()}
                textClassName="text-primary-foreground"
              />
            </View>
            <View className="flex-1">
              <Button
                title="Kết thúc"
                variant="outline"
                onPress={() => setShowEndModal(true)}
              />
            </View>
          </View>
        ) : null}
        <Text className="mt-lg text-center text-body-sm text-on-surface-variant">
          Hình ảnh camera chỉ dùng để thử đồ trực tiếp và được bảo mật.
        </Text>
      </View>
      </ScrollView>

      <FeedbackModal
        visible={showEndModal}
        onClose={() => setShowEndModal(false)}
        type="warning"
        title="Kết thúc phiên?"
        message="Phiên thử đồ trực tiếp sẽ dừng lại."
        primaryButtonText="Kết thúc"
        primaryButtonVariant="primary"
        onPrimaryPress={() => {
          setShowEndModal(false);
          end('client_end');
        }}
        secondaryButtonText="Ở lại"
      />
    </View>
  );
};

export default TryOnLiveScreen;
