import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Check, Clock } from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { ToneLabel } from '@/features/orders/components/ToneLabel';
import type { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/format';
import { formatDate } from '@/utils/date';
import {
  useSubscriptionPlans,
  useMySubscription,
  useSubscriptionHistory,
  useCancelAutoRenew,
  useResumeAutoRenew,
  useCancelScheduledSubscription,
  useUpgradeSubscription,
} from '../hooks/use-subscription';
import {
  QUOTA_NOT_INCLUDED,
  QUOTA_ROWS,
  SUBSCRIPTION_FAQS,
  SUBSCRIPTION_TIER_LABELS,
  formatQuota,
  getSubscriptionStatusLabel,
} from '../constants/plans';
import { SubscriptionHistoryList } from '../components/SubscriptionHistoryList';
import { SubscriptionTier, PlanCardData } from '../types/subscription';

type SubscriptionTab = 'plans' | 'current' | 'history';

const TABS: { id: SubscriptionTab; label: string }[] = [
  { id: 'plans', label: 'Bảng giá' },
  { id: 'current', label: 'Gói của tôi' },
  { id: 'history', label: 'Lịch sử thanh toán' },
];

// Cùng bộ nhãn, nút và khối của các trang tài khoản trên web (account-ui).
const eyebrowClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
const sectionTitleClass = 'font-display text-[22px] leading-tight text-landing-obsidian';
const actionLabelClass = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';
const primaryButtonClass =
  'h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood px-5 active:opacity-90';
const outlineButtonClass =
  'h-11 flex-row items-center justify-center gap-2 rounded-subtle border border-landing-line px-5 active:opacity-70';
const dangerButtonClass =
  'h-11 flex-row items-center justify-center gap-2 rounded-subtle border border-danger/40 px-4 active:opacity-70';

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-baseline justify-between gap-4 border-b border-landing-line/70 py-4">
      <Text className="font-sans text-body-sm text-landing-muted">{label}</Text>
      <View className="shrink items-end">{children}</View>
    </View>
  );
}

export const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'SubscriptionPlans'>>();
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<SubscriptionTab>(
    route.params?.tab ?? 'plans',
  );
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    plans,
    hasApiPlans,
    isLoading: isLoadingPlans,
    refetch: refetchPlans,
  } = useSubscriptionPlans();

  const {
    subscription,
    isLoading: isLoadingSub,
    refetch: refetchSub,
  } = useMySubscription();

  const {
    history,
    meta: historyMeta,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useSubscriptionHistory(1, 20);

  // Mutations
  const { cancelAutoRenew, isCancelling } = useCancelAutoRenew();
  const { resumeAutoRenew, isResuming } = useResumeAutoRenew();
  const { cancelScheduled, isCancellingScheduled } = useCancelScheduledSubscription();
  const { checkoutAsync, isCheckingOut } = useUpgradeSubscription();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPlans(), refetchSub(), refetchHistory(), refreshUser()]);
    setRefreshing(false);
  };

  // Determine current tier & expiration info
  const currentTier = (
    subscription?.tier ||
    user?.tier ||
    'FREE'
  ).toUpperCase() as SubscriptionTier;

  const currentSub = subscription?.current;
  const scheduledSub = subscription?.scheduled;
  const rawExpiresAt = subscription?.tierExpiresAt || user?.tierExpiresAt;

  const expirationInfo = useMemo(() => {
    const rawExp = subscription?.tierExpiresAt || user?.tierExpiresAt;
    if (!rawExp || currentTier === 'FREE') return null;

    try {
      const expDate = new Date(rawExp);
      const now = new Date();
      const diffMs = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        formattedDate: expDate.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        daysRemaining: currentSub?.daysRemaining ?? Math.max(0, diffDays),
        isExpired: diffMs <= 0,
        isExpiringSoon: diffDays <= 3 && diffMs > 0,
      };
    } catch {
      return null;
    }
  }, [subscription?.tierExpiresAt, user?.tierExpiresAt, currentTier, currentSub]);

  // Handle upgrade or renewal
  const handleUpgrade = (targetTier: 'MEMBER' | 'VIP') => {
    const isRenewal = currentTier === targetTier;
    const isUpgradeFromMember = currentTier === 'MEMBER' && targetTier === 'VIP';

    let confirmMsg = `Bạn muốn nâng cấp lên gói ${targetTier} (30 ngày)?`;
    if (isRenewal) {
      confirmMsg = `Gia hạn gói ${targetTier}: 30 ngày mới sẽ được cộng dồn tiếp vào ngày hết hạn hiện tại của bạn.`;
    } else if (isUpgradeFromMember) {
      confirmMsg =
        'Nâng cấp lên gói VIP: gói VIP có hiệu lực ngay sau khi thanh toán. Giá trị còn lại của gói Member được trừ vào tiền gói mới.';
    }

    Alert.alert(
      isRenewal ? 'Xác nhận gia hạn gói' : 'Xác nhận nâng cấp gói',
      confirmMsg,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Tiếp tục thanh toán',
          onPress: async () => {
            try {
              const res = await checkoutAsync({
                targetTier,
                provider: 'SEPAY',
              });

              const checkoutUrl = res.checkoutUrl || res.payUrl;
              if (!checkoutUrl) {
                Alert.alert('Lỗi', 'Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.');
                return;
              }

              navigation.navigate('Payment', {
                checkoutUrl,
                provider: 'SEPAY',
                orderId: res.orderId,
                orderCode: res.orderCode?.toString(),
                totalAmount: res.amount,
                paymentId: res.paymentId,
                targetTier,
                returnRoute: 'SubscriptionPlans',
              });
            } catch (err: any) {
              Alert.alert(
                'Lỗi khởi tạo thanh toán',
                err?.message || 'Chưa thể kết nối tới cổng thanh toán. Vui lòng thử lại sau.',
              );
            }
          },
        },
      ],
    );
  };

  // Toggle Auto-renew
  const handleToggleAutoRenew = () => {
    if (!currentSub) return;
    const willCancel = currentSub.autoRenew;

    Alert.alert(
      willCancel ? 'Tắt nhắc gia hạn' : 'Bật nhắc gia hạn',
      willCancel
        ? 'Gói vẫn dùng bình thường đến ngày hết hạn. Khi hết hạn, tài khoản tự về gói miễn phí.'
        : 'Bạn sẽ nhận email nhắc trước 3 ngày khi gói sắp hết hạn.',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: willCancel ? 'Tắt nhắc' : 'Bật nhắc',
          style: willCancel ? 'destructive' : 'default',
          onPress: () => {
            if (willCancel) {
              cancelAutoRenew(undefined, {
                onSuccess: () =>
                  Alert.alert(
                    'Thành công',
                    'Đã tắt nhắc gia hạn. Bạn vẫn dùng gói đến hết ngày hết hạn.',
                  ),
                onError: (e: any) => Alert.alert('Lỗi', e?.message || 'Chưa thể cập nhật.'),
              });
            } else {
              resumeAutoRenew(undefined, {
                onSuccess: () => Alert.alert('Thành công', 'Đã bật lại nhắc gia hạn.'),
                onError: (e: any) => Alert.alert('Lỗi', e?.message || 'Chưa thể cập nhật.'),
              });
            }
          },
        },
      ],
    );
  };

  // Hủy lịch chuyển gói
  const handleCancelScheduled = () => {
    Alert.alert(
      `Hủy lịch chuyển gói ${scheduledSub?.tier ?? ''}?`,
      'Chỉ hủy lịch, số tiền đã thanh toán không được hoàn lại. Gói hiện tại vẫn dùng đến ngày hết hạn.',
      [
        { text: 'Giữ lại', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: () => {
            cancelScheduled(undefined, {
              onSuccess: () =>
                Alert.alert(
                  'Thành công',
                  'Đã hủy lịch chuyển gói. Gói hiện tại vẫn tiếp tục đến ngày hết hạn.',
                ),
              onError: (e: any) => Alert.alert('Lỗi', e?.message || 'Không thể hủy lúc này.'),
            });
          },
        },
      ],
    );
  };

  const currentStatus = currentSub ? getSubscriptionStatusLabel(currentSub.status) : null;

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-lg pb-giant pt-lg"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.oxblood]}
            tintColor={COLORS.oxblood}
          />
        }
      >
        <BackButton onPress={() => navigation.goBack()} />

        <View className="gap-2 border-b border-landing-line pb-5">
          <Text className={eyebrowClass}>Tài khoản</Text>
          <Text
            accessibilityRole="header"
            className="font-display text-[30px] leading-tight text-landing-obsidian"
          >
            Gói thành viên
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            So sánh lượt Thử đồ AI, AI Stylist và chat AI của từng gói, rồi chọn gói hợp với bạn.
          </Text>
        </View>

        <View className="-mx-4 border-b border-landing-line">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-6 px-4"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setActiveTab(tab.id)}
                  className={`h-11 shrink-0 flex-row items-center border-b-2 ${
                    isActive ? 'border-oxblood' : 'border-transparent'
                  }`}
                >
                  <Text
                    className={`font-sans text-[13px] ${
                      isActive ? 'font-medium text-oxblood' : 'text-landing-obsidian/70'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {activeTab === 'plans' && (
          <View className="gap-10">
            <View className="gap-3 border-l-2 border-landing-brass bg-landing-ivory px-4 py-4">
              <View className="gap-1.5">
                <Text className={eyebrowClass}>Gói của bạn</Text>
                <Text className="font-display text-[24px] leading-tight text-landing-obsidian">
                  {plans.find((plan) => plan.id === currentTier)?.name ?? currentTier}
                </Text>
                {expirationInfo ? (
                  expirationInfo.isExpired ? (
                    <Text className="font-sans text-body-sm leading-relaxed text-danger">
                      Đã hết hạn ngày{' '}
                      <Text className="font-mono">{expirationInfo.formattedDate}</Text>. Gia hạn để
                      dùng lại Thử đồ AI.
                    </Text>
                  ) : (
                    <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                      Hiệu lực đến{' '}
                      <Text className="font-mono text-landing-obsidian">
                        {expirationInfo.formattedDate}
                      </Text>
                      , còn <Text className="font-mono">{expirationInfo.daysRemaining}</Text> ngày.
                    </Text>
                  )
                ) : (
                  <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                    {currentTier === 'FREE'
                      ? 'Gói miễn phí, chưa có lượt Thử đồ AI bằng ảnh.'
                      : 'Đang hoạt động.'}
                  </Text>
                )}
              </View>
              {currentTier !== 'FREE' ? (
                <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
                  Gia hạn cùng gói khi còn hạn: 30 ngày mới nối tiếp sau ngày hết hạn hiện tại.
                </Text>
              ) : null}
            </View>

            {isLoadingPlans ? (
              <View className="items-center justify-center gap-3 py-12">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
                <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
                  Đang tải bảng giá
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {plans.map((plan: PlanCardData) => {
                  const isCurrent = currentTier === plan.id;
                  const isMember = plan.id === 'MEMBER';
                  const isDowngradeDisabled =
                    isMember && currentTier === 'VIP' && scheduledSub !== null;
                  const isDisabled = isCheckingOut || isDowngradeDisabled;
                  const ctaLabel = isCheckingOut
                    ? 'Đang xử lý'
                    : isDowngradeDisabled
                      ? 'Đã lên lịch chuyển gói'
                      : isCurrent
                        ? 'Gia hạn thêm 30 ngày'
                        : plan.ctaText;

                  return (
                    <View
                      key={plan.id}
                      className={`rounded-subtle border bg-ivory/50 p-5 ${
                        isCurrent ? 'border-oxblood' : 'border-landing-line'
                      }`}
                    >
                      <View className="flex-row items-baseline justify-between gap-3">
                        <Text className="flex-1 font-display text-[24px] leading-tight text-landing-obsidian">
                          {plan.name}
                        </Text>
                        {isCurrent ? (
                          <Text className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-oxblood">
                            Gói của bạn
                          </Text>
                        ) : null}
                      </View>

                      <Text className="mt-2 font-sans text-body-sm leading-relaxed text-landing-muted">
                        {plan.description}
                      </Text>

                      <View className="mt-5 flex-row items-baseline gap-2 border-b border-landing-line/70 pb-5">
                        <Text className="font-mono text-[28px] leading-none text-oxblood">
                          {plan.priceText}
                        </Text>
                        <Text className="font-sans text-body-sm text-landing-muted">
                          {plan.periodText}
                        </Text>
                      </View>

                      <View className="mt-5 gap-3">
                        {plan.features.map((feat) => (
                          <View key={feat.text} className="flex-row items-start gap-2.5">
                            <View className="pt-0.5">
                              <Check
                                size={16}
                                strokeWidth={2}
                                color={feat.highlight ? COLORS.oxblood : COLORS.muted}
                              />
                            </View>
                            <Text
                              className={`flex-1 font-sans text-body-sm leading-relaxed ${
                                feat.highlight ? 'text-landing-obsidian' : 'text-landing-muted'
                              }`}
                            >
                              {feat.text}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View className="mt-8">
                        {plan.id === 'FREE' ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ disabled: true }}
                            disabled
                            className={`${outlineButtonClass} opacity-50`}
                          >
                            <Text className={`${actionLabelClass} text-landing-obsidian`}>
                              {isCurrent ? 'Gói hiện tại' : 'Có sẵn khi đăng ký'}
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={ctaLabel}
                            accessibilityState={{ disabled: isDisabled }}
                            disabled={isDisabled}
                            onPress={() => handleUpgrade(plan.id as 'MEMBER' | 'VIP')}
                            className={`${isCurrent ? outlineButtonClass : primaryButtonClass} ${
                              isDisabled ? 'opacity-50' : ''
                            }`}
                          >
                            <Text
                              className={`${actionLabelClass} ${
                                isCurrent ? 'text-landing-obsidian' : 'text-landing-paper'
                              }`}
                            >
                              {ctaLabel}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {hasApiPlans ? (
              <View className="gap-4">
                <Text accessibilityRole="header" className={sectionTitleClass}>
                  So sánh lượt dùng mỗi ngày
                </Text>
                <View className="rounded-subtle border border-landing-line">
                  <View className="flex-row items-end border-b border-landing-line bg-landing-ivory/60 px-3 py-3">
                    <Text className="w-[34%] pr-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
                      Tính năng
                    </Text>
                    {plans.map((plan) => (
                      <Text
                        key={plan.id}
                        className="w-[22%] pr-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-ink"
                      >
                        {plan.name}
                      </Text>
                    ))}
                  </View>

                  {QUOTA_ROWS.map((row, idx) => (
                    <View
                      key={row.action}
                      className={`flex-row items-start px-3 py-3 ${
                        idx < QUOTA_ROWS.length - 1 ? 'border-b border-landing-line/60' : ''
                      }`}
                    >
                      <Text className="w-[34%] pr-2 font-sans text-body-sm text-landing-obsidian">
                        {row.label}
                      </Text>
                      {plans.map((plan) => {
                        const value = formatQuota(
                          plan.quotas?.find((quota) => quota.action === row.action),
                          row.unit,
                        );
                        return (
                          <Text
                            key={plan.id}
                            className={`w-[22%] pr-1 ${
                              value === QUOTA_NOT_INCLUDED
                                ? 'font-sans text-[12px] text-landing-muted'
                                : 'font-mono text-[11px] text-landing-obsidian'
                            }`}
                          >
                            {value}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="gap-4">
              <Text accessibilityRole="header" className={sectionTitleClass}>
                Câu hỏi thường gặp
              </Text>
              <View className="border-y border-landing-line/70">
                {SUBSCRIPTION_FAQS.map((faq, idx) => (
                  <View
                    key={faq.question}
                    className={`gap-1.5 py-4 ${
                      idx < SUBSCRIPTION_FAQS.length - 1 ? 'border-b border-landing-line/70' : ''
                    }`}
                  >
                    <Text className="font-sans text-body-md font-medium text-landing-obsidian">
                      {faq.question}
                    </Text>
                    <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                      {faq.answer}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="items-center gap-2 pb-2">
              <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                © 2026 StAie.
              </Text>
              <View className="flex-row flex-wrap items-center justify-center gap-1">
                <Pressable
                  accessibilityRole="link"
                  onPress={() => (navigation as any).navigate('Policy', { type: 'terms' })}
                  className="min-h-11 justify-center px-2 active:opacity-60"
                >
                  <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-landing-muted">
                    Điều khoản
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => (navigation as any).navigate('Policy', { type: 'privacy' })}
                  className="min-h-11 justify-center px-2 active:opacity-60"
                >
                  <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-landing-muted">
                    Bảo mật
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => (navigation as any).navigate('Policy', { type: 'return' })}
                  className="min-h-11 justify-center px-2 active:opacity-60"
                >
                  <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-landing-muted">
                    Đổi trả &amp; Hỗ trợ
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'current' && (
          <View className="gap-10">
            {isLoadingSub ? (
              <View className="items-center justify-center gap-3 py-12">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
                <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
                  Đang tải gói của bạn
                </Text>
              </View>
            ) : (
              <View>
                <View className="gap-5 border-b border-landing-line pb-6">
                  <View>
                    <Text className={eyebrowClass}>Gói hiện tại</Text>
                    <View className="mt-3 flex-row flex-wrap items-baseline gap-x-4 gap-y-2">
                      <Text className="font-display text-[44px] leading-none text-oxblood">
                        {SUBSCRIPTION_TIER_LABELS[currentTier] ?? currentTier}
                      </Text>
                      {currentStatus ? (
                        <ToneLabel tone={currentStatus.tone} label={currentStatus.label} />
                      ) : null}
                    </View>
                  </View>
                  {currentTier === 'FREE' ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setActiveTab('plans')}
                      className={`${primaryButtonClass} self-start`}
                    >
                      <Text className={`${actionLabelClass} text-landing-paper`}>Xem các gói</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isCheckingOut }}
                      disabled={isCheckingOut}
                      onPress={() => handleUpgrade(currentTier as 'MEMBER' | 'VIP')}
                      className={`${primaryButtonClass} self-start ${isCheckingOut ? 'opacity-50' : ''}`}
                    >
                      <Text className={`${actionLabelClass} text-landing-paper`}>
                        {isCheckingOut ? 'Đang xử lý' : 'Gia hạn thêm 30 ngày'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <InfoRow label="Hiệu lực đến">
                  {rawExpiresAt && currentTier !== 'FREE' ? (
                    <Text className="font-mono text-[13px] text-landing-obsidian">
                      {formatDate(rawExpiresAt)}
                    </Text>
                  ) : (
                    <Text className="font-sans text-body-sm text-landing-muted">Không thời hạn</Text>
                  )}
                </InfoRow>
                <InfoRow label="Còn lại">
                  {expirationInfo ? (
                    <Text
                      className={`font-sans text-body-sm ${
                        expirationInfo.isExpired
                          ? 'text-danger'
                          : expirationInfo.isExpiringSoon
                            ? 'text-brass-ink'
                            : 'text-landing-obsidian'
                      }`}
                    >
                      <Text className="font-mono">{expirationInfo.daysRemaining}</Text> ngày
                      {expirationInfo.isExpiringSoon ? ', sắp hết hạn' : ''}
                    </Text>
                  ) : (
                    <Text className="font-sans text-body-sm text-landing-obsidian">Không thời hạn</Text>
                  )}
                </InfoRow>
                <InfoRow label="Đã thanh toán">
                  {currentSub?.price != null && currentSub.price > 0 ? (
                    <Text className="font-mono text-[13px] text-landing-obsidian">
                      {formatCurrency(currentSub.price)}
                    </Text>
                  ) : (
                    <Text className="font-sans text-body-sm text-landing-muted">Chưa có</Text>
                  )}
                </InfoRow>
                <InfoRow label="Nhắc gia hạn">
                  {currentSub ? (
                    <Text className="font-sans text-body-sm text-landing-obsidian">
                      {currentSub.autoRenew ? 'Đang bật' : 'Đã tắt'}
                    </Text>
                  ) : (
                    <Text className="font-sans text-body-sm text-landing-muted">Chưa có</Text>
                  )}
                </InfoRow>
              </View>
            )}

            {scheduledSub && (
              <View className="gap-4 border-l-2 border-landing-brass bg-landing-ivory px-4 py-4">
                <View className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Clock size={14} strokeWidth={1.75} color={COLORS.brassInk} />
                    <Text className="font-sans text-body-md font-medium text-landing-obsidian">
                      Gói {SUBSCRIPTION_TIER_LABELS[scheduledSub.tier] ?? scheduledSub.tier} đã lên
                      lịch
                    </Text>
                  </View>
                  <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                    Bắt đầu từ{' '}
                    <Text className="font-mono">{formatDate(scheduledSub.startsAt) || 'Chưa có'}</Text>
                    , sau khi gói hiện tại hết hạn.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isCancellingScheduled }}
                  onPress={handleCancelScheduled}
                  disabled={isCancellingScheduled}
                  className={`${dangerButtonClass} self-start ${
                    isCancellingScheduled ? 'opacity-50' : ''
                  }`}
                >
                  <Text className={`${actionLabelClass} text-danger`}>
                    {isCancellingScheduled ? 'Đang hủy' : 'Hủy lịch chuyển gói'}
                  </Text>
                </Pressable>
              </View>
            )}

            {currentSub && (
              <View className="gap-4">
                <View className="gap-1">
                  <Text accessibilityRole="header" className={sectionTitleClass}>
                    Nhắc gia hạn
                  </Text>
                  <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                    {currentSub.autoRenew
                      ? 'Bạn sẽ nhận email nhắc trước 3 ngày khi gói sắp hết hạn.'
                      : 'Đã tắt nhắc. Khi hết hạn, tài khoản tự về gói miễn phí.'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isCancelling || isResuming }}
                  onPress={handleToggleAutoRenew}
                  disabled={isCancelling || isResuming}
                  className={`${outlineButtonClass} self-start ${
                    isCancelling || isResuming ? 'opacity-50' : ''
                  }`}
                >
                  <Text className={`${actionLabelClass} text-landing-obsidian`}>
                    {isCancelling || isResuming
                      ? 'Đang xử lý'
                      : currentSub.autoRenew
                        ? 'Tắt nhắc gia hạn'
                        : 'Bật nhắc gia hạn'}
                  </Text>
                </Pressable>
              </View>
            )}

            <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
              Mỗi lần mua hoặc gia hạn là một lần thanh toán riêng. StAie. không tự động trừ tiền.
            </Text>
          </View>
        )}

        {activeTab === 'history' && (
          <SubscriptionHistoryList
            history={history}
            isLoading={isLoadingHistory}
            total={historyMeta.total}
            onBrowsePlans={() => setActiveTab('plans')}
          />
        )}
      </ScrollView>
    </View>
  );
};
