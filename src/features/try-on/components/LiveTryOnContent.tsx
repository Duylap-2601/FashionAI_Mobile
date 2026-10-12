import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { liveTryOnApi } from '@/features/try-on/api/live-try-on.api';
import { useLiveTryOn } from '@/features/try-on/hooks/use-live-try-on';
import { Loading } from '@/components/common/Loading';
import { Button } from '@/components/ui/Button';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TryOnModeToggle, TryOnSharedIntro } from '@/features/try-on/components/TryOnHeader';
import { GarmentProductCard, GarmentPreview } from '@/features/try-on/components/GarmentProductCard';
import type { SharedGarmentSelection } from './TryOnWorkspace';

interface LiveTryOnContentProps {
  selection: SharedGarmentSelection;
  photoQuota: { remaining?: number; limit?: number } | null;
  onSwitchToPhoto: () => void;
}

function formatSeconds(total: number): string {
  // Guard để UI không bao giờ hiện NaN khi BE thiếu field.
  if (!Number.isFinite(total) || total < 0) return '--:--';
  const safe = Math.floor(total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const LiveTryOnContent: React.FC<LiveTryOnContentProps> = ({
  selection,
  photoQuota,
  onSwitchToPhoto,
}) => {
  const { singleProduct, comboUpper, comboLower, openPicker } = selection;
  const [permission, requestPermission] = useCameraPermissions();
  const [showEndModal, setShowEndModal] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'combo'>('single');
  const insets = useSafeAreaInsets();
  const { phase, remainingSeconds, error, start, pause, resume, end } =
    useLiveTryOn();

  const quotaQuery = useQuery({
    queryKey: ['live-try-on-quota'],
    queryFn: () => liveTryOnApi.getQuota(),
  });

  // Session BE chỉ nhận 1 productId: chế độ phối bộ dùng áo làm sản phẩm chính,
  // giống logic primaryProduct của bản web.
  const sessionProduct =
    mode === 'single' ? singleProduct : comboUpper;
  const sessionProductId = sessionProduct ? String(sessionProduct.id) : undefined;

  const garmentQuery = useQuery({
    queryKey: ['live-try-on-garment', sessionProductId],
    queryFn: () => liveTryOnApi.checkGarment(sessionProductId as string),
    enabled: !!sessionProductId,
  });

  // Đóng phiên còn dở khi rời màn hình để không treo session phía server.
  useEffect(() => {
    return () => {
      end('screen_exit');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quota = quotaQuery.data;
  const garmentSupported = garmentQuery.data ? garmentQuery.data.supported : true;

  const unavailableReason: string | null =
    quotaQuery.isLoading || garmentQuery.isLoading
      ? 'Đang kiểm tra thời gian thử đồ…'
      : quotaQuery.isError
        ? 'Chưa tải được thời gian sử dụng. Vui lòng thử lại.'
        : quota && !quota.enabled
          ? 'Thử đồ trực tiếp hiện đang tạm nghỉ. Bạn vẫn có thể thử bằng ảnh.'
          : quota && !quota.eligible
            ? 'Bạn chưa đủ điều kiện dùng Live Try-On.'
            : !sessionProduct
              ? mode === 'single'
                ? 'Chọn một sản phẩm để bắt đầu thử đồ.'
                : 'Chọn đủ áo và quần để bắt đầu.'
              : !garmentSupported
                ? 'Sản phẩm này chưa hỗ trợ thử trực tiếp.'
                : quota && quota.remaining <= 0
                  ? 'Bạn đã dùng hết thời gian Live hôm nay.'
                  : null;

  const handleStart = async () => {
    if (!sessionProductId || unavailableReason) return;
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setPermissionDenied(true);
        return;
      }
    }
    setPermissionDenied(false);
    start(sessionProductId);
  };

  const inSession =
    phase === 'starting' ||
    phase === 'active' ||
    phase === 'paused' ||
    phase === 'ending';

  const phaseLabel =
    phase === 'starting'
      ? 'Đang tạo phiên...'
      : phase === 'active'
        ? 'Đang trực tiếp'
        : phase === 'paused'
          ? 'Đã tạm dừng'
          : phase === 'ending'
            ? 'Đang kết thúc...'
            : '';

  const timerBlock = quotaQuery.isLoading ? (
    <Loading message="" />
  ) : quota ? (
    <Text className="font-heading text-headline-md font-bold text-on-surface">
      {formatSeconds(quota.maxDurationSeconds)}
    </Text>
  ) : (
    <Text className="text-body-sm text-danger">Chưa tải được thời gian sử dụng.</Text>
  );

  const startButton = (
    <Button
      title="Bắt đầu thử đồ"
      onPress={handleStart}
      disabled={!!unavailableReason}
      textClassName="text-primary-foreground"
      leftIcon={
        <Ionicons name="play" size={18} className="text-primary-foreground" />
      }
    />
  );

  if (inSession) {
    return (
      <ScrollView className="flex-1" contentContainerClassName="p-xl">
        <TryOnSharedIntro quota={photoQuota} />
        <TryOnModeToggle
          value="live"
          onChange={(next) => {
            if (next === 'photo') onSwitchToPhoto();
          }}
        />
        <View className="mt-xl overflow-hidden rounded-xl border border-surface-line bg-surface-lowest shadow-sm">
          <View className="h-80">
            {/* CameraView là native view của bên thứ ba nên dùng style trực tiếp */}
            <CameraView style={{ flex: 1 }} facing="front" />
            {/* Khung căn người tĩnh (không gắn trạng thái detection giả) */}
            <View
              pointerEvents="none"
              className="absolute inset-x-16 inset-y-10 rounded-b-xl rounded-t-full border-2 border-inverse-on-surface/30"
            />
            <View className="absolute left-md top-md rounded-full bg-inverse-surface px-md py-xs">
              <Text className="text-body-sm font-semibold text-inverse-on-surface">
                {phaseLabel}
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

        <View className="mt-xl">
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
      </ScrollView>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="p-xl">
        <TryOnSharedIntro quota={photoQuota} />
        <TryOnModeToggle
          value="live"
          onChange={(next) => {
            if (next === 'photo') onSwitchToPhoto();
          }}
        />

        <Text className="mt-xl text-label-md uppercase text-on-surface-variant">
          Live fitting room
        </Text>
        <Text className="mt-xs font-heading text-headline-lg font-bold text-on-surface-strong">
          Phòng thử của bạn
        </Text>
        <Text className="mt-xs text-body-sm text-on-surface-variant">
          Một góc nhìn mới, một bộ đồ thật hợp.
        </Text>

        {/* Khung camera chờ theo ảnh mẫu: placeholder tối, chưa bật preview
            cho tới khi user bấm Bắt đầu (đỡ tốn pin + rõ ràng về quyền riêng tư). */}
        <View className="mt-lg overflow-hidden rounded-2xl bg-inverse-surface">
          <View className="items-center px-xl pb-xxl pt-xl">
            <View className="flex-row items-center gap-xs self-start rounded-full bg-black/40 px-md py-xs">
              <View className="h-1.5 w-1.5 rounded-full bg-success" />
              <Text className="text-label-md text-inverse-on-surface">
                Sẵn sàng thử đồ
              </Text>
            </View>
            <View className="mt-xl h-20 w-20 items-center justify-center rounded-full border border-inverse-on-surface/20">
              <Ionicons name="shirt-outline" size={36} className="text-inverse-on-surface" />
            </View>
            <Text className="mt-lg text-center font-heading text-headline-md font-bold text-inverse-on-surface">
              Sẵn sàng cho diện mạo mới?
            </Text>
            <Text className="mt-sm text-center text-body-sm text-inverse-on-surface">
              Chọn trang phục, bật camera và xem ngay trên chính bạn.
            </Text>
            <View className="mt-lg h-24 w-32 rounded-b-xl rounded-t-full border border-inverse-on-surface/20" />
          </View>
        </View>

        <View className="mt-xxl flex-row items-center justify-between">
          <Text className="font-heading text-headline-sm font-bold text-on-surface">
            Bạn muốn mặc gì?
          </Text>
          <Text className="text-body-sm text-on-surface-variant">
            {mode === 'single' ? '01 món đồ' : '02 món đồ'}
          </Text>
        </View>
        <View className="mt-md">
          <SegmentedControl
            options={[
              { value: 'single', label: 'Một món' },
              { value: 'combo', label: 'Áo + quần' },
            ]}
            value={mode}
            onChange={(next) => setMode(next as 'single' | 'combo')}
          />
        </View>

        {mode === 'single' ? (
          <View className="mt-md">
            {singleProduct ? (
              <>
                <GarmentProductCard
                  product={singleProduct}
                  onChange={() => openPicker('single')}
                  changeLabel="Đổi món"
                />
                <GarmentPreview product={singleProduct} label={singleProduct.name} />
              </>
            ) : (
              <Pressable
                className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xl"
                onPress={() => openPicker('single')}
              >
                <Text className="text-center text-body-sm font-semibold text-on-surface">
                  Chưa chọn trang phục
                </Text>
                <Text className="mt-xs text-center text-body-sm text-primary-container">
                  Chọn sản phẩm ›
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View className="mt-md gap-xl">
            <View>
              <View className="mb-sm">
                <Text className="text-body-sm font-semibold text-on-surface">
                  Món 1: Áo / Blazer (Upper)
                </Text>
              </View>
              {comboUpper ? (
                <>
                  <GarmentProductCard
                    product={comboUpper}
                    onChange={() => openPicker('upper')}
                    changeLabel="Đổi áo khác"
                  />
                  <GarmentPreview product={comboUpper} label={comboUpper.name} />
                </>
              ) : (
                <Pressable
                  className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xl"
                  onPress={() => openPicker('upper')}
                >
                  <Text className="text-center text-body-sm font-semibold text-on-surface">
                    Chưa chọn áo
                  </Text>
                  <Text className="mt-xs text-center text-body-sm text-primary-container">
                    Chọn áo ›
                  </Text>
                </Pressable>
              )}
            </View>
            <View>
              <View className="mb-sm">
                <Text className="text-body-sm font-semibold text-on-surface">
                  Món 2: Quần / Chân váy (Lower)
                </Text>
              </View>
              {comboLower ? (
                <>
                  <GarmentProductCard
                    product={comboLower}
                    onChange={() => openPicker('lower')}
                    changeLabel="Đổi quần/váy khác"
                  />
                  <GarmentPreview product={comboLower} label={comboLower.name} />
                </>
              ) : (
                <Pressable
                  className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xl"
                  onPress={() => openPicker('lower')}
                >
                  <Text className="text-center text-body-sm font-semibold text-on-surface">
                    Chưa chọn quần/váy
                  </Text>
                  <Text className="mt-xs text-center text-body-sm text-primary-container">
                    Chọn quần/váy ›
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-sm rounded-lg bg-primary-soft p-md">
              <Ionicons
                name="information-circle-outline"
                size={20}
                className="text-primary-container"
              />
              <Text className="flex-1 text-body-sm leading-relaxed text-on-surface">
                Thử cả bộ vẫn dùng chung thời gian của một phiên.
              </Text>
            </View>
          </View>
        )}

        {quota && typeof quota.limit === 'number' ? (
          <View className="mt-xl overflow-hidden rounded-xl border border-surface-line bg-surface-lowest">
            <Pressable
              className="min-h-11 flex-row items-center justify-between p-md"
              onPress={() => setQuotaOpen((prev) => !prev)}
            >
              <Text className="text-body-sm font-semibold text-on-surface">
                Thời gian Live hôm nay
              </Text>
              <View className="flex-row items-center gap-sm">
                <Text className="text-body-sm font-semibold text-primary-container">
                  {formatSeconds(quota.limit)} có thể dùng
                </Text>
                <Ionicons
                  name={quotaOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  className="text-on-surface-variant"
                />
              </View>
            </Pressable>
            {quotaOpen ? (
              <View className="border-t border-surface-line p-md">
                <View className="flex-row justify-between py-xs">
                  <Text className="text-body-sm text-on-surface-variant">
                    Tổng thời gian mỗi ngày
                  </Text>
                  <Text className="text-body-sm font-semibold text-on-surface">
                    {formatSeconds(quota.limit)}
                  </Text>
                </View>
                <View className="flex-row justify-between py-xs">
                  <Text className="text-body-sm text-on-surface-variant">Đã sử dụng</Text>
                  <Text className="text-body-sm font-semibold text-on-surface">
                    {formatSeconds(quota.limit - quota.remaining)}
                  </Text>
                </View>
                <Text className="mt-sm text-body-sm leading-relaxed text-on-surface-variant">
                  Thời gian còn lại của phiên hiển thị ở bộ đếm. Live không sử dụng
                  lượt thử bằng ảnh.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          className="mt-xl min-h-11 flex-row items-center justify-center gap-sm"
          onPress={onSwitchToPhoto}
        >
          <Text className="text-label-lg text-primary-container">Thử bằng ảnh</Text>
          <Ionicons name="arrow-forward" size={16} className="text-primary-container" />
        </Pressable>
        <Text className="mt-lg text-center text-body-sm text-on-surface-variant">
          Hình ảnh camera chỉ dùng để thử đồ trực tiếp và được bảo mật.
        </Text>
        </ScrollView>

      {/* Thanh cố định đáy: thẻ timer + CTA, luôn trên tab bar */}
      <View style={{ paddingBottom: insets.bottom }}>
        <View className="border-t border-surface-line bg-background px-xl pb-md pt-md">
          <View className="flex-row items-center gap-md rounded-xl border border-surface-line bg-surface-lowest p-md shadow-sm">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
              <Ionicons name="timer-outline" size={20} className="text-primary-container" />
            </View>
            <View className="flex-1">
              <Text className="text-body-sm text-on-surface-variant">
                Thời gian cho phiên mới
              </Text>
              {timerBlock}
            </View>
            {quota?.eligible ? (
              <View className="items-end">
                <View className="mb-xs h-2 w-2 rounded-full bg-success" />
                <Text className="text-body-sm text-on-surface-variant">
                  Sẵn sàng khi bạn muốn
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mt-md">{startButton}</View>
          {unavailableReason ? (
            <Text className="mt-sm text-center text-body-sm text-danger" numberOfLines={2}>
              {unavailableReason}
            </Text>
          ) : null}
          {permissionDenied ? (
            <View className="mt-md rounded-lg border border-surface-line bg-surface-lowest p-md">
              <Text className="text-center text-body-sm text-danger">
                FashionAI cần quyền camera để thử đồ trực tiếp.
              </Text>
              <Button
                className="mt-md"
                title="Cho phép camera"
                size="sm"
                onPress={() => requestPermission()}
              />
            </View>
          ) : null}
          {error ? (
            <Text className="mt-sm text-center text-body-sm text-danger" numberOfLines={2}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default LiveTryOnContent;
