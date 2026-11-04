import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Camera,
  ChevronDown,
  ChevronUp,
  CirclePause,
  Expand,
  Image as ImageIcon,
  Layers,
  Play,
  Shirt,
  Square,
  Timer,
} from 'lucide-react-native';
import { liveTryOnApi } from '@/features/try-on/api/live-try-on.api';
import { useLiveTryOn } from '@/features/try-on/hooks/use-live-try-on';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { COLORS } from '@/constants/theme';
import {
  TryOnPageHeader,
  TryOnSegmented,
} from '@/features/try-on/components/TryOnHeader';
import { GarmentSlot } from '@/features/try-on/components/GarmentProductCard';
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

// Lý do chưa đủ điều kiện, cùng câu chữ với FE (live-try-on-workspace.tsx › reasonLabel).
function reasonLabel(reason?: string): string {
  if (reason === 'free_not_allowed') return 'Nâng cấp gói thành viên để thử đồ trực tiếp.';
  if (reason === 'subscription_expired') return 'Gói thành viên đã hết hạn. Gia hạn để tiếp tục thử đồ.';
  return 'Thử đồ trực tiếp chưa khả dụng với tài khoản của bạn.';
}

const primaryButtonClass =
  'h-12 flex-1 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90';
// Nút viền trên dock obsidian: viền brass mảnh, chữ giấy (DESIGN.md › Live Try-On).
const outlineButtonClass =
  'h-12 items-center justify-center rounded-subtle border border-landing-line px-4';
const STAGE_CHIP_CLASS = 'border border-landing-line bg-landing-obsidian/80 px-3 py-2';

export const LiveTryOnContent: React.FC<LiveTryOnContentProps> = ({
  selection,
  photoQuota,
  onSwitchToPhoto,
}) => {
  const { singleProduct, comboOuter, comboUpper, comboLower, clearOuter, openPicker } =
    selection;
  const { height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [showEndModal, setShowEndModal] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [mode, setMode] = useState<'single' | 'combo'>('single');
  const { phase, remainingSeconds, error, start, pause, resume, end } =
    useLiveTryOn();

  const quotaQuery = useQuery({
    queryKey: ['live-try-on-quota'],
    queryFn: () => liveTryOnApi.getQuota(),
  });

  // Session BE chỉ nhận 1 productId: chế độ phối bộ dùng áo làm sản phẩm chính.
  const sessionProduct = mode === 'single' ? singleProduct : comboUpper;
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

  const inSession =
    phase === 'starting' ||
    phase === 'active' ||
    phase === 'paused' ||
    phase === 'ending';
  const isActive = phase === 'active';
  const isPaused = phase === 'paused';
  const isBusy = phase === 'starting' || phase === 'ending';
  const seconds = inSession
    ? remainingSeconds
    : quota?.maxDurationSeconds ?? 0;
  const lowTime = inSession && seconds > 0 && seconds <= 10;
  const selectionDisabled = isActive || isBusy;
  const selectedCount =
    mode === 'combo'
      ? [comboOuter, comboUpper, comboLower].filter(Boolean).length
      : 1;
  const stageHeight = Math.max(300, Math.min(height * 0.58, 560));

  const unavailableReason: string | null =
    quotaQuery.isLoading || garmentQuery.isLoading
      ? 'Đang kiểm tra thời gian thử đồ…'
      : quotaQuery.isError
        ? 'Chưa tải được thời gian sử dụng. Vui lòng thử lại.'
        : quota && !quota.enabled
          ? 'Thử đồ trực tiếp hiện đang tạm nghỉ. Bạn vẫn có thể thử bằng ảnh.'
          : quota && !quota.eligible
            ? reasonLabel(quota.disabledReason)
            : !sessionProduct
              ? mode === 'single'
                ? 'Chọn một sản phẩm để bắt đầu thử đồ.'
                : 'Chọn đủ áo và quần để bắt đầu.'
              : !garmentSupported
                ? 'Sản phẩm này chưa hỗ trợ thử trực tiếp.'
                : quota && quota.remaining <= 0
                  ? 'Bạn đã dùng hết thời gian thử trực tiếp hôm nay.'
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

  const handlePrimaryPress = () => {
    if (isActive) {
      pause();
      return;
    }
    if (isPaused) {
      resume();
      return;
    }
    void handleStart();
  };

  const primaryLabel = isBusy
    ? 'Vui lòng chờ'
    : isActive
      ? 'Tạm dừng'
      : isPaused
        ? 'Tiếp tục thử'
        : 'Bắt đầu thử đồ';
  const primaryDisabled =
    isBusy || (!isActive && !isPaused && (Boolean(unavailableReason) || !sessionProductId));

  const statusLabel = isBusy
    ? phase === 'starting'
      ? 'Đang chuẩn bị'
      : 'Đang kết thúc'
    : isPaused
      ? 'Đã tạm dừng'
      : isActive
        ? 'Đang thử trực tiếp'
        : phase === 'ended'
          ? 'Phiên đã kết thúc'
          : 'Sẵn sàng thử đồ';

  const panelStatus = isBusy
    ? phase === 'starting'
      ? 'Đang chuẩn bị'
      : 'Đang kết thúc'
    : isPaused
      ? 'Đã tạm dừng'
      : lowTime
        ? 'Sắp hết thời gian'
        : isActive
          ? 'Đang tính thời gian'
          : 'Sẵn sàng khi bạn muốn';

  const guideText = isPaused
    ? 'Chọn lại món bạn thích. Nhấn Tiếp tục để mặc trang phục mới.'
    : isActive
      ? 'Muốn đổi đồ? Nhấn Tạm dừng trước khi chọn món mới.'
      : 'Thử cả bộ vẫn dùng chung thời gian của một phiên.';

  return (
    <View className="flex-1 bg-landing-paper">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-lg pb-[220px] pt-lg"
        showsVerticalScrollIndicator={false}
      >
        <TryOnPageHeader
          mode="live"
          onModeChange={(next) => {
            if (next === 'photo') onSwitchToPhoto();
          }}
          modeDisabled={isBusy}
          photoQuota={photoQuota}
        />

        {/* Stage */}
        <View className="overflow-hidden bg-landing-obsidian">
          <View style={{ height: stageHeight }}>
            {inSession ? (
              <CameraView style={StyleSheet.absoluteFill} facing="front" />
            ) : null}

            <View
              pointerEvents="none"
              className="absolute bottom-[10%] left-[18%] right-[18%] top-[10%] rounded-t-[140px] border border-landing-brass/25"
            />

            {!inSession ? (
              <View className="flex-1 items-center justify-center px-8">
                <View className="h-14 w-14 items-center justify-center border border-landing-paper/20">
                  {isBusy ? (
                    <ActivityIndicator color={COLORS.brass} />
                  ) : isPaused ? (
                    <CirclePause size={26} strokeWidth={1.3} color={COLORS.brass} />
                  ) : (
                    <Shirt size={26} strokeWidth={1.3} color={COLORS.brass} />
                  )}
                </View>
                <Text className="mt-5 text-center font-display text-[28px] leading-tight text-landing-paper">
                  {isPaused ? 'Đang tạm dừng' : 'Sẵn sàng thử đồ'}
                </Text>
                <Text className="mt-3 max-w-[280px] text-center font-sans text-body-sm leading-relaxed text-landing-paper/65">
                  {isPaused
                    ? 'Đổi trang phục bên dưới rồi tiếp tục phiên đang có.'
                    : 'Chọn trang phục, bật camera và xem ngay trên chính bạn.'}
                </Text>
              </View>
            ) : null}

            <View
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
              className={`absolute left-4 top-4 flex-row items-center gap-2 ${STAGE_CHIP_CLASS}`}
            >
              <View
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? 'bg-sage' : isPaused ? 'bg-brass' : 'bg-landing-paper/50'
                }`}
              />
              <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                {statusLabel}
              </Text>
            </View>

            {isActive ? (
              <View className={`absolute right-4 top-4 ${STAGE_CHIP_CLASS}`}>
                <Text className="font-mono text-[12px] text-landing-paper">
                  {formatSeconds(remainingSeconds)}
                </Text>
              </View>
            ) : null}

            {isPaused ? (
              <View className="absolute inset-0 items-center justify-center bg-landing-obsidian/55">
                <Text className="font-display text-[22px] leading-tight text-landing-paper">
                  Phiên đang tạm dừng
                </Text>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center gap-2 border-t border-landing-line px-lg py-3">
            <Expand size={14} strokeWidth={1.75} color={COLORS.brass} />
            <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-paper/70">
              {mode === 'combo'
                ? 'Lùi lại để thấy trọn áo và quần trong khung hình.'
                : 'Đứng nơi đủ sáng, giữ trang phục trong khung hình.'}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-center gap-2 px-2">
          <Camera size={13} strokeWidth={1.75} color={COLORS.muted} />
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
            Camera chỉ được gửi để xử lý khi bạn bắt đầu hoặc tiếp tục thử.
          </Text>
        </View>

        {/* Trang phục */}
        <View className="mt-8">
          <View className="mb-4 flex-row items-baseline justify-between gap-3">
            <Text
              accessibilityRole="header"
              className="font-display text-[22px] leading-tight text-landing-obsidian"
            >
              Trang phục
            </Text>
            <Text className="font-mono text-xs text-landing-muted">
              {String(selectedCount).padStart(2, '0')} món
            </Text>
          </View>

          <TryOnSegmented
            accessibilityLabel="Số món thử"
            value={mode}
            onChange={setMode}
            disabled={selectionDisabled}
            options={[
              { value: 'single', label: 'Một món' },
              {
                value: 'combo',
                label: 'Phối bộ',
                icon: (selected) => (
                  <Layers
                    size={14}
                    strokeWidth={1.75}
                    color={selected ? COLORS.paper : COLORS.obsidian}
                  />
                ),
              },
            ]}
          />

          <View className="mt-5">
            {mode === 'single' ? (
              <GarmentSlot
                label="Trang phục"
                product={singleProduct}
                emptyLabel="Chưa chọn trang phục"
                onChange={() => openPicker('single')}
                disabled={selectionDisabled}
              />
            ) : (
              <View className="border-y border-landing-line">
                <View className="border-b border-landing-line py-4">
                  <GarmentSlot
                    label="Lớp ngoài"
                    hint="Tùy chọn"
                    product={comboOuter}
                    emptyLabel="Áo khoác hoặc blazer"
                    onChange={() => openPicker('outer')}
                    onClear={comboOuter ? clearOuter : undefined}
                    disabled={selectionDisabled}
                  />
                </View>
                <View className="border-b border-landing-line py-4">
                  <GarmentSlot
                    label="Lớp trong"
                    product={comboUpper}
                    emptyLabel="Sơ mi hoặc áo trong"
                    onChange={() => openPicker('upper')}
                    disabled={selectionDisabled}
                  />
                </View>
                <View className="py-4">
                  <GarmentSlot
                    label="Phần dưới"
                    product={comboLower}
                    emptyLabel="Quần hoặc chân váy"
                    onChange={() => openPicker('lower')}
                    disabled={selectionDisabled}
                  />
                </View>
              </View>
            )}
          </View>

          <View className="mt-4 flex-row items-start gap-2">
            <CirclePause
              size={14}
              strokeWidth={1.75}
              color={isPaused ? COLORS.oxblood : COLORS.muted}
            />
            <Text
              className={`flex-1 font-sans text-body-sm leading-relaxed ${
                isPaused ? 'text-oxblood' : 'text-landing-muted'
              }`}
            >
              {guideText}
            </Text>
          </View>
        </View>

        {/* Quota chi tiết */}
        <View className="mt-8 border-y border-landing-line">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thời gian thử trực tiếp hôm nay"
            accessibilityHint={quotaOpen ? 'Thu gọn chi tiết' : 'Xem chi tiết thời gian'}
            accessibilityState={{ expanded: quotaOpen }}
            className="min-h-12 flex-row items-center justify-between gap-3 active:opacity-70"
            onPress={() => setQuotaOpen((prev) => !prev)}
          >
            <Text className="font-sans text-body-sm text-landing-muted">
              Thời gian thử trực tiếp hôm nay
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="font-sans text-body-sm text-landing-obsidian">
                {quotaQuery.isLoading ? (
                  'Đang tải…'
                ) : quota ? (
                  <>
                    <Text className="font-mono">{formatSeconds(quota.remaining)}</Text> còn dùng được
                  </>
                ) : (
                  'Chưa có dữ liệu'
                )}
              </Text>
              {quotaOpen ? (
                <ChevronUp size={14} strokeWidth={1.75} color={COLORS.obsidian} />
              ) : (
                <ChevronDown size={14} strokeWidth={1.75} color={COLORS.obsidian} />
              )}
            </View>
          </Pressable>
          {quotaOpen && quota ? (
            <View className="gap-2 border-t border-landing-line py-3">
              <View className="flex-row justify-between">
                <Text className="font-sans text-body-sm text-landing-muted">Tổng thời gian mỗi ngày</Text>
                <Text className="font-mono text-body-sm text-landing-obsidian">{formatSeconds(quota.limit ?? 0)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-sans text-body-sm text-landing-muted">Đã sử dụng</Text>
                <Text className="font-mono text-body-sm text-landing-obsidian">
                  {formatSeconds(quota.allocated ?? 0)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-sans text-body-sm text-landing-muted">Dành cho phiên đang mở</Text>
                <Text className="font-mono text-body-sm text-landing-obsidian">
                  {formatSeconds(quota.reserved ?? 0)}
                </Text>
              </View>
              <Text className="pt-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                Thời gian còn lại của phiên hiển thị ở bộ đếm. Thử trực tiếp không trừ
                lượt thử bằng ảnh.
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thử bằng ảnh"
          accessibilityState={{ disabled: inSession || isBusy }}
          disabled={inSession || isBusy}
          onPress={onSwitchToPhoto}
          className={`mt-4 min-h-11 flex-row items-center justify-center gap-2 ${inSession || isBusy ? 'opacity-50' : 'active:opacity-70'}`}
        >
          <ImageIcon size={14} strokeWidth={1.75} color={COLORS.muted} />
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-muted">
            Thử bằng ảnh
          </Text>
          <ArrowRight size={13} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>

        {/* Trạng thái không khả dụng */}
        {error || (!inSession && unavailableReason) || permissionDenied ? (
          <View
            accessibilityRole="alert"
            className={`mt-4 border-l-2 bg-ivory px-4 py-3 ${
              error ? 'border-danger' : 'border-landing-brass'
            }`}
          >
            <Text
              className={`font-sans text-body-sm leading-relaxed ${
                error ? 'text-danger' : 'text-landing-obsidian'
              }`}
            >
              {error || (!inSession ? unavailableReason : null)}
            </Text>
            {permissionDenied ? (
              <Text className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted">
                FashionAI cần quyền camera để thử đồ trực tiếp.
              </Text>
            ) : null}
            {permissionDenied ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cho phép camera"
                onPress={() => requestPermission()}
                className="mt-3 h-11 items-center justify-center self-start rounded-subtle bg-oxblood px-4 active:opacity-90"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                  Cho phép camera
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Thanh phiên cố định phía trên tab bar: dock obsidian, chữ giấy, viền brass mảnh
          (DESIGN.md › Live Try-On). */}
      <View
        accessibilityLabel="Điều khiển phiên thử trực tiếp"
        className="absolute bottom-0 left-0 right-0 border-t border-landing-line bg-landing-obsidian px-lg py-md"
      >
        <View className="mb-3 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-3">
            <View
              className={`h-10 w-10 items-center justify-center border ${
                lowTime ? 'border-brass' : 'border-landing-line'
              }`}
            >
              <Timer size={18} strokeWidth={1.5} color={COLORS.brass} />
            </View>
            <View>
              <Text className="font-sans text-[11px] text-landing-paper/65">
                {inSession ? 'Thời gian phiên còn lại' : 'Thời gian cho phiên mới'}
              </Text>
              <Text
                accessibilityRole="timer"
                accessibilityLabel={`${inSession ? 'Phiên còn' : 'Phiên mới'} ${
                  quotaQuery.isLoading && !inSession ? 'đang tải' : formatSeconds(seconds)
                }`}
                className={`font-mono text-[28px] leading-8 tabular-nums ${
                  lowTime ? 'text-brass' : 'text-landing-paper'
                }`}
              >
                {quotaQuery.isLoading && !inSession ? '--:--' : formatSeconds(seconds)}
              </Text>
            </View>
          </View>
          <Text
            accessibilityLiveRegion="polite"
            className={`max-w-[130px] text-right font-sans text-[11px] ${
              isPaused || lowTime ? 'text-brass' : 'text-landing-paper/65'
            }`}
          >
            {panelStatus}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            accessibilityState={{ disabled: primaryDisabled, busy: isBusy }}
            disabled={primaryDisabled}
            onPress={handlePrimaryPress}
            className={`${primaryButtonClass} ${primaryDisabled ? 'opacity-50' : ''}`}
          >
            {isBusy ? (
              <ActivityIndicator color={COLORS.paper} size="small" />
            ) : isActive ? (
              <CirclePause size={17} strokeWidth={1.75} color={COLORS.paper} />
            ) : (
              <Play size={15} fill={COLORS.paper} color={COLORS.paper} />
            )}
            <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              {primaryLabel}
            </Text>
          </Pressable>
          {inSession ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kết thúc phiên"
              accessibilityState={{ disabled: isBusy }}
              disabled={isBusy}
              onPress={() => setShowEndModal(true)}
              className={`${outlineButtonClass} ${isBusy ? 'opacity-50' : 'active:opacity-70'}`}
            >
              <View className="flex-row items-center gap-1.5">
                <Square size={13} strokeWidth={1.75} color={COLORS.paper} />
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                  Kết thúc
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
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
    </View>
  );
};

export default LiveTryOnContent;
