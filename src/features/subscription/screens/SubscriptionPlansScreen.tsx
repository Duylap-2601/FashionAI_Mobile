import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Check, Clock, RefreshCw, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import {
  useSubscriptionPlans,
  useMySubscription,
  useSubscriptionHistory,
  useCancelAutoRenew,
  useResumeAutoRenew,
  useCancelScheduledSubscription,
  useUpgradeSubscription,
} from '../hooks/use-subscription';
import { QUOTA_COMPARISON, SUBSCRIPTION_FAQS } from '../constants/plans';
import { SubscriptionTier, PlanCardData } from '../types/subscription';
import { formatCurrency } from '@/utils/format';

type SubscriptionTab = 'plans' | 'current' | 'history';

const TABS: { id: SubscriptionTab; label: string }[] = [
  { id: 'plans', label: 'Bảng giá' },
  { id: 'current', label: 'Gói của tôi' },
  { id: 'history', label: 'Lịch sử thanh toán' },
];

const eyebrowClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink';
const mutedLabelClass =
  'font-sans text-[10.5px] uppercase tracking-[0.16em] text-landing-muted';
const monoValueClass = 'font-mono text-[12px] text-landing-obsidian';
const cardClass = 'rounded-subtle border border-landing-line bg-ivory';
const primaryButtonClass =
  'h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood px-4 active:opacity-90';
const outlineButtonClass =
  'h-11 items-center justify-center rounded-subtle border border-landing-line px-4 active:bg-landing-paper';
const primaryButtonLabel =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper';
const outlineButtonLabel =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian';

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
      confirmMsg = `Nâng cấp lên gói VIP: Gói VIP sẽ được kích hoạt ngay lập tức để bạn có ngay 10 lượt Try-on/ngày và AI Stylist không giới hạn.`;
    }

    Alert.alert(
      isRenewal ? 'Xác nhận gia hạn gói' : 'Xác nhận nâng cấp gói',
      confirmMsg,
      [
        { text: 'Hủy', style: 'cancel' },
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
      willCancel ? 'Tắt tự động gia hạn' : 'Bật lại tự động gia hạn',
      willCancel
        ? 'Bạn có chắc chắn muốn tắt tự động gia hạn? Gói vẫn sẽ sử dụng bình thường đến hết ngày hết hạn.'
        : 'Hệ thống sẽ tự động nhắc nhở gia hạn trước 3 ngày để bạn không bị gián đoạn tính năng Thử đồ AI.',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: willCancel ? 'Tắt gia hạn' : 'Bật gia hạn',
          style: willCancel ? 'destructive' : 'default',
          onPress: () => {
            if (willCancel) {
              cancelAutoRenew(undefined, {
                onSuccess: () => Alert.alert('Thành công', 'Đã tắt tự động gia hạn.'),
                onError: (e: any) => Alert.alert('Lỗi', e?.message || 'Chưa thể cập nhật.'),
              });
            } else {
              resumeAutoRenew(undefined, {
                onSuccess: () => Alert.alert('Thành công', 'Đã bật lại tự động gia hạn.'),
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
      'Hủy lịch chuyển gói',
      'Bạn có chắc chắn muốn hủy lịch chuyển gói đang chờ không?',
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: () => {
            cancelScheduled(undefined, {
              onSuccess: () => Alert.alert('Thành công', 'Đã hủy lịch chuyển gói.'),
              onError: (e: any) => Alert.alert('Lỗi', e?.message || 'Không thể hủy lúc này.'),
            });
          },
        },
      ],
    );
  };

  const renderHistoryStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-ink">
            Đang dùng
          </Text>
        );
      case 'SCHEDULED':
        return (
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
            Lên lịch
          </Text>
        );
      case 'EXPIRED':
        return (
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            Hết hạn
          </Text>
        );
      case 'CANCELLED':
        return (
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-danger">
            Đã hủy
          </Text>
        );
      default:
        return (
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            {status}
          </Text>
        );
    }
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-lg pb-giant pt-lg"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BackButton onPress={() => navigation.goBack()} />

        <View className="gap-2 border-b border-landing-line pb-5">
          <Text className={eyebrowClass}>Gói thành viên</Text>
          <Text
            accessibilityRole="header"
            className="font-display text-headline-lg text-landing-obsidian"
          >
            Gói thành viên
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            So sánh lượt Thử đồ AI, AI Stylist và chat AI của từng gói, rồi chọn gói hợp với bạn.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row gap-6"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActiveTab(tab.id)}
                className={`min-h-11 shrink-0 justify-center border-b-2 pb-2.5 pt-2 active:opacity-70 ${
                  isActive ? 'border-oxblood' : 'border-transparent'
                }`}
              >
                <Text
                  className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isActive ? 'text-oxblood' : 'text-landing-muted'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === 'plans' && (
          <View className="gap-4">
            <View className="gap-1 border-l-2 border-landing-brass bg-landing-ivory px-4 py-4">
              <Text className={mutedLabelClass}>Gói của bạn</Text>
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
                    , còn {expirationInfo.daysRemaining} ngày.
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

            {isLoadingPlans ? (
              <View className="items-center justify-center gap-3 py-12">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
                <Text className="font-sans text-body-sm text-landing-muted">
                  Đang tải thông tin gói cước...
                </Text>
              </View>
            ) : (
              plans.map((plan: PlanCardData) => {
                const isCurrent = currentTier === plan.id;
                const isMember = plan.id === 'MEMBER';
                const isDowngradeDisabled =
                  isMember && currentTier === 'VIP' && scheduledSub !== null;
                const isFeatured = isCurrent || Boolean(plan.isPopular);

                return (
                  <View
                    key={plan.id}
                    className={`rounded-subtle border bg-ivory p-5 ${
                      isFeatured ? 'border-oxblood' : 'border-landing-line'
                    }`}
                  >
                    <View className="flex-row items-baseline justify-between gap-3">
                      <Text className="flex-1 font-display text-[22px] leading-tight text-landing-obsidian">
                        {plan.name}
                      </Text>
                      {isCurrent ? (
                        <Text className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-oxblood">
                          Gói của bạn
                        </Text>
                      ) : plan.badge ? (
                        <Text className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                          {plan.badge}
                        </Text>
                      ) : null}
                    </View>

                    <Text className="mt-2 min-h-[40px] font-sans text-body-sm leading-relaxed text-landing-muted">
                      {plan.description}
                    </Text>

                    <View className="mt-4 flex-row items-baseline gap-2 border-b border-landing-line pb-4">
                      <Text className="font-mono text-[26px] leading-none text-oxblood">
                        {plan.priceText}
                      </Text>
                      <Text className="font-sans text-body-sm text-landing-muted">
                        {plan.periodText}
                      </Text>
                    </View>

                    <Text className="mt-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
                      Quyền lợi gói
                    </Text>

                    <View className="mt-3 flex-1 gap-2.5">
                      {plan.features.map((feat, idx) => (
                        <View key={idx} className="flex-row items-start gap-2.5">
                          <View
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 items-center justify-center border ${
                              feat.highlight ? 'border-oxblood' : 'border-landing-line'
                            }`}
                          >
                            <Check
                              size={9}
                              strokeWidth={2.5}
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

                    <View className="mt-5">
                      {plan.id === 'FREE' ? (
                        <View className="h-12 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper/60">
                          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
                            {isCurrent ? 'Gói hiện tại của bạn' : 'Mặc định khi đăng ký'}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          accessibilityRole="button"
                          activeOpacity={0.85}
                          disabled={isCheckingOut || isDowngradeDisabled}
                          onPress={() => handleUpgrade(plan.id as 'MEMBER' | 'VIP')}
                          className={`${primaryButtonClass} ${
                            isCheckingOut || isDowngradeDisabled ? 'opacity-50' : ''
                          }`}
                        >
                          {isCheckingOut ? (
                            <ActivityIndicator size="small" color={COLORS.paper} />
                          ) : isDowngradeDisabled ? (
                            <Text className={primaryButtonLabel}>Đã lên lịch chuyển gói</Text>
                          ) : isCurrent ? (
                            <>
                              <RefreshCw size={14} strokeWidth={1.75} color={COLORS.paper} />
                              <Text className={primaryButtonLabel}>Gia hạn thêm 30 ngày</Text>
                            </>
                          ) : (
                            <>
                              <Text className={primaryButtonLabel}>{plan.ctaText}</Text>
                              <ArrowRight size={14} strokeWidth={1.75} color={COLORS.paper} />
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            <View className={cardClass}>
              <View className="gap-1 border-b border-landing-line px-4 py-4">
                <Text className={eyebrowClass}>So sánh</Text>
                <Text className="font-display text-[20px] leading-tight text-landing-obsidian">
                  Hạn mức tính năng AI
                </Text>
              </View>

              <View className="flex-row items-end border-b border-landing-line bg-landing-paper/40 px-3 py-2.5">
                <Text className="w-[34%] pr-2 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-brass-ink">
                  Tính năng
                </Text>
                <Text className="w-[22%] text-center font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-brass-ink">
                  Miễn phí
                </Text>
                <Text className="w-[22%] text-center font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-brass-ink">
                  Member
                </Text>
                <Text className="w-[22%] text-center font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-brass-ink">
                  VIP
                </Text>
              </View>

              {QUOTA_COMPARISON.map((row, idx) => (
                <View
                  key={idx}
                  className={`flex-row items-center px-3 py-3 ${
                    idx < QUOTA_COMPARISON.length - 1 ? 'border-b border-landing-line' : ''
                  }`}
                >
                  <Text className="w-[34%] pr-2 font-sans text-body-sm text-landing-obsidian">
                    {row.featureName}
                  </Text>
                  <Text className="w-[22%] text-center font-mono text-[10.5px] text-landing-muted">
                    {row.free}
                  </Text>
                  <Text className="w-[22%] text-center font-mono text-[10.5px] text-landing-obsidian">
                    {row.member}
                  </Text>
                  <Text className="w-[22%] text-center font-mono text-[10.5px] text-landing-obsidian">
                    {row.vip}
                  </Text>
                </View>
              ))}
            </View>

            <View className={`${cardClass} px-4 py-5`}>
              <Text className={eyebrowClass}>Hỗ trợ</Text>
              <Text className="mt-1 font-display text-[20px] leading-tight text-landing-obsidian">
                Câu hỏi thường gặp
              </Text>

              <View className="mt-4">
                {SUBSCRIPTION_FAQS.map((faq, idx) => (
                  <View
                    key={idx}
                    className={
                      idx < SUBSCRIPTION_FAQS.length - 1
                        ? 'mb-4 border-b border-landing-line pb-4'
                        : ''
                    }
                  >
                    <Text className="font-display text-[16px] leading-snug text-landing-obsidian">
                      {faq.question}
                    </Text>
                    <Text className="mt-1.5 font-sans text-body-sm leading-relaxed text-landing-muted">
                      {faq.answer}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="items-center gap-2 pb-2">
              <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-landing-muted">
                © 2026 StAle. All rights reserved.
              </Text>
              <View className="flex-row flex-wrap items-center justify-center gap-1">
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => (navigation as any).navigate('Policy', { type: 'terms' })}
                  className="min-h-11 justify-center px-2"
                >
                  <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-landing-muted">
                    Điều khoản
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => (navigation as any).navigate('Policy', { type: 'privacy' })}
                  className="min-h-11 justify-center px-2"
                >
                  <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-landing-muted">
                    Bảo mật
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => (navigation as any).navigate('Policy', { type: 'return' })}
                  className="min-h-11 justify-center px-2"
                >
                  <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-landing-muted">
                    Đổi trả &amp; Hỗ trợ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'current' && (
          <View className="gap-4">
            {isLoadingSub ? (
              <View className="items-center justify-center gap-3 py-12">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
                <Text className="font-sans text-body-sm text-landing-muted">
                  Đang tải thông tin gói của bạn...
                </Text>
              </View>
            ) : (
              <View className={`${cardClass} px-4 py-5`}>
                <View className="flex-row items-start justify-between gap-3 border-b border-landing-line pb-4">
                  <View className="flex-1 gap-1">
                    <Text className={mutedLabelClass}>Gói hiện tại</Text>
                    <Text className="font-display text-[28px] leading-none text-oxblood">
                      {currentTier === 'FREE' ? 'Miễn phí' : currentTier}
                    </Text>
                  </View>
                  <View className="min-h-11 justify-center">
                    {renderHistoryStatusBadge(
                      currentSub?.status || (currentTier === 'FREE' ? 'FREE' : 'ACTIVE'),
                    )}
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center justify-between gap-4 border-b border-landing-line py-3.5">
                    <Text className="font-sans text-body-sm text-landing-muted">
                      Hiệu lực đến
                    </Text>
                    <Text className={monoValueClass}>
                      {expirationInfo ? expirationInfo.formattedDate : 'Không thời hạn'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between gap-4 border-b border-landing-line py-3.5">
                    <Text className="font-sans text-body-sm text-landing-muted">Còn lại</Text>
                    {expirationInfo ? (
                      <Text
                        className={`font-mono text-[12px] ${
                          expirationInfo.isExpired
                            ? 'text-danger'
                            : expirationInfo.isExpiringSoon
                            ? 'text-brass-ink'
                            : 'text-landing-obsidian'
                        }`}
                      >
                        {expirationInfo.daysRemaining} ngày
                        {expirationInfo.isExpiringSoon ? ', sắp hết hạn' : ''}
                      </Text>
                    ) : (
                      <Text className={monoValueClass}>Không thời hạn</Text>
                    )}
                  </View>
                  <View className="flex-row items-center justify-between gap-4 border-b border-landing-line py-3.5">
                    <Text className="font-sans text-body-sm text-landing-muted">
                      Nhắc gia hạn
                    </Text>
                    <Text className={monoValueClass}>
                      {currentSub ? (currentSub.autoRenew ? 'Đang bật' : 'Đã tắt') : 'Chưa có'}
                    </Text>
                  </View>
                </View>

                {currentSub && (
                  <View className="gap-3 pt-4">
                    <View>
                      <Text className="font-sans text-body-md text-landing-obsidian">
                        Tự động gia hạn
                      </Text>
                      <Text className="mt-0.5 font-sans text-body-sm leading-relaxed text-landing-muted">
                        Gia hạn khi kết thúc chu kỳ 30 ngày.
                      </Text>
                    </View>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={handleToggleAutoRenew}
                      disabled={isCancelling || isResuming}
                      className={`h-11 items-center justify-center rounded-subtle border px-4 active:opacity-80 ${
                        currentSub.autoRenew ? 'border-danger' : 'border-oxblood'
                      } ${isCancelling || isResuming ? 'opacity-50' : ''}`}
                    >
                      <Text
                        className={`font-sans text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          currentSub.autoRenew ? 'text-danger' : 'text-oxblood'
                        }`}
                      >
                        {currentSub.autoRenew ? 'Tắt gia hạn' : 'Bật gia hạn'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {scheduledSub && (
              <View className="gap-2 border-l-2 border-landing-brass bg-landing-ivory px-4 py-4">
                <View className="flex-row items-center gap-2">
                  <Clock size={13} strokeWidth={1.75} color={COLORS.brassInk} />
                  <Text className={eyebrowClass}>Lịch chuyển gói</Text>
                </View>
                <Text className="font-display text-[18px] leading-tight text-landing-obsidian">
                  Gói {scheduledSub.tier}
                </Text>
                <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                  Tự động kích hoạt sau khi gói hiện tại hết hạn.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleCancelScheduled}
                  disabled={isCancellingScheduled}
                  className={`mt-1 ${outlineButtonClass} ${
                    isCancellingScheduled ? 'opacity-50' : ''
                  }`}
                >
                  <Text className={outlineButtonLabel}>
                    {isCancellingScheduled ? 'Đang hủy...' : 'Hủy lịch chuyển gói'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
              Mỗi lần mua hoặc gia hạn là một lần thanh toán riêng. FashionAI không tự động trừ
              tiền.
            </Text>
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            {isLoadingHistory ? (
              <View className="items-center justify-center gap-3 py-12">
                <ActivityIndicator size="small" color={COLORS.oxblood} />
                <Text className="font-sans text-body-sm text-landing-muted">
                  Đang tải lịch sử...
                </Text>
              </View>
            ) : !history || history.length === 0 ? (
              <View className={`${cardClass} items-center gap-3 px-6 py-12`}>
                <View className="h-16 w-16 items-center justify-center border border-landing-line">
                  <Clock size={22} strokeWidth={1.5} color={COLORS.muted} />
                </View>
                <Text className="text-center font-display text-[20px] text-landing-obsidian">
                  Chưa có lịch sử đăng ký
                </Text>
                <Text className="text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                  Các gói dịch vụ bạn đã thanh toán sẽ được lưu trữ và hiển thị tại đây.
                </Text>
              </View>
            ) : (
              history.map((item: any) => (
                <View key={item.id} className={`${cardClass} mb-3 px-4 py-4`}>
                  <View className="flex-row items-baseline justify-between gap-3 border-b border-landing-line pb-3">
                    <Text className="flex-1 font-display text-[18px] leading-tight text-landing-obsidian">
                      Gói {item.tier}
                    </Text>
                    <Text className="shrink-0 font-mono text-[13px] text-oxblood">
                      {formatCurrency(item.amount || (item.tier === 'MEMBER' ? 34000 : 99000))}
                    </Text>
                  </View>
                  <View className="mt-3 flex-row items-center justify-between gap-3">
                    {renderHistoryStatusBadge(item.status)}
                    <Text className="font-mono text-[11px] text-landing-muted">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <Text className="mt-2 font-sans text-[10.5px] uppercase tracking-[0.16em] text-landing-muted">
                    Cổng {item.provider || 'SEPAY'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
