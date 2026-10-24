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
import { useNavigation } from '@react-navigation/native';
import {
  Check,
  Crown,
  Shield,
  Clock,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
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

export const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'plans' | 'current' | 'history'>('plans');
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
          <View className="rounded-full bg-emerald-100 px-2.5 py-0.5">
            <Text className="text-[11px] font-bold text-emerald-800">Đang dùng</Text>
          </View>
        );
      case 'SCHEDULED':
        return (
          <View className="rounded-full bg-blue-100 px-2.5 py-0.5">
            <Text className="text-[11px] font-bold text-blue-800">Lên lịch</Text>
          </View>
        );
      case 'EXPIRED':
        return (
          <View className="rounded-full bg-neutral-100 px-2.5 py-0.5">
            <Text className="text-[11px] font-bold text-[#6B7280]">Hết hạn</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View className="rounded-full bg-red-100 px-2.5 py-0.5">
            <Text className="text-[11px] font-bold text-red-700">Đã hủy</Text>
          </View>
        );
      default:
        return (
          <View className="rounded-full bg-neutral-100 px-2.5 py-0.5">
            <Text className="text-[11px] font-bold text-[#6B7280]">{status}</Text>
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-[#FBF9F7]">
      <AppHeader />

      {/* ── Scrollable Body ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <BackButton onPress={() => navigation.goBack()} />

        {/* ── Hero Heading & Badge ── */}
        <View className="items-center mt-2 mb-3">
          <View className="flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5D1C34]/10">
            <Crown size={14} color="#5D1C34" />
            <Text className="text-[12.5px] font-bold text-[#5D1C34]">
              Dịch vụ Hội viên FashionAI
            </Text>
          </View>
        </View>

        <Text className="text-[26px] font-bold text-[#5D1C34] text-center leading-tight px-2">
          Trải nghiệm thời trang{'\n'}may đo chuẩn xác cùng AI
        </Text>

        <Text className="text-[13px] text-[#534346] text-center mt-3 px-4 leading-5">
          Mở khóa tính năng Thử đồ AI ảo độc quyền, tư vấn phối trang phục theo số đo cơ thể và nhận may đo chính xác từng centimet.
        </Text>

        {/* ── Segmented Control (3 Tabs) ── */}
        <View className="items-center my-6">
          <View className="flex-row p-1.5 bg-white rounded-2xl border border-[#ECE8E3] shadow-sm gap-1 w-full max-w-[360px] justify-between">
            <TouchableOpacity
              onPress={() => setActiveTab('plans')}
              className={`flex-1 py-2 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                activeTab === 'plans' ? 'bg-[#5D1C34]' : 'bg-transparent'
              }`}
            >
              <Zap
                size={14}
                color={activeTab === 'plans' ? '#FFFFFF' : '#534346'}
                fill={activeTab === 'plans' ? '#FFFFFF' : 'none'}
              />
              <Text
                className={`text-[12.5px] font-bold text-center leading-4 ${
                  activeTab === 'plans' ? 'text-white' : 'text-[#534346]'
                }`}
              >
                Bảng giá{'\n'}gói cước
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('current')}
              className={`flex-1 py-2 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                activeTab === 'current' ? 'bg-[#5D1C34]' : 'bg-transparent'
              }`}
            >
              <Crown size={14} color={activeTab === 'current' ? '#FFFFFF' : '#534346'} />
              <Text
                className={`text-[12.5px] font-bold text-center leading-4 ${
                  activeTab === 'current' ? 'text-white' : 'text-[#534346]'
                }`}
              >
                Gói{'\n'}của tôi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-2 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                activeTab === 'history' ? 'bg-[#5D1C34]' : 'bg-transparent'
              }`}
            >
              <Clock size={14} color={activeTab === 'history' ? '#FFFFFF' : '#534346'} />
              <Text
                className={`text-[12.5px] font-bold text-center leading-4 ${
                  activeTab === 'history' ? 'text-white' : 'text-[#534346]'
                }`}
              >
                Lịch sử{'\n'}đăng ký
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─────────────────── TAB 1: BẢNG GIÁ GÓI ─────────────────── */}
        {activeTab === 'plans' && (
          <View>
            {/* Account Status Card */}
            <View className="bg-white border border-[#ECE8E3] rounded-3xl p-5 mb-6 shadow-sm flex-row items-center gap-4">
              <View
                className={`w-14 h-14 rounded-2xl items-center justify-center shrink-0 shadow-xs ${
                  currentTier === 'VIP'
                    ? 'bg-[#5D1C34]'
                    : currentTier === 'MEMBER'
                    ? 'bg-[#5D1C34]'
                    : 'bg-[#F7F5F2]'
                }`}
              >
                {currentTier === 'VIP' ? (
                  <Crown size={26} color="#FFE173" />
                ) : currentTier === 'MEMBER' ? (
                  <Sparkles size={26} color="#FFFFFF" />
                ) : (
                  <Shield size={26} color="#5D1C34" />
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-[16px] font-bold text-[#5D1C34]">
                    Tài khoản của bạn: Gói {currentTier}
                  </Text>
                  {expirationInfo && !expirationInfo.isExpired && (
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        expirationInfo.isExpiringSoon ? 'bg-amber-100' : 'bg-emerald-100'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          expirationInfo.isExpiringSoon ? 'text-amber-800' : 'text-emerald-800'
                        }`}
                      >
                        {expirationInfo.isExpiringSoon ? 'Sắp hết hạn' : 'Đang hoạt động'}
                      </Text>
                    </View>
                  )}
                </View>

                {expirationInfo ? (
                  expirationInfo.isExpired ? (
                    <Text className="mt-1 text-[12.5px] font-medium text-red-600">
                      Gói cước đã hết hạn vào ngày {expirationInfo.formattedDate}. Vui lòng gia hạn để tiếp tục dùng Thử đồ AI.
                    </Text>
                  ) : (
                    <Text className="mt-1 text-[12.5px] text-[#6B7280]">
                      Thời hạn đến: <Text className="font-bold text-[#5D1C34]">{expirationInfo.formattedDate}</Text> • Còn{' '}
                      <Text className="font-bold text-[#5D1C34]">{expirationInfo.daysRemaining} ngày</Text>
                    </Text>
                  )
                ) : (
                  <Text className="mt-1 text-[13px] text-[#6B7280] leading-5">
                    {currentTier === 'FREE'
                      ? 'Nâng cấp ngay để mở khóa tính năng Thử đồ AI (5-10 lượt/ngày) và ưu tiên may đo.'
                      : 'Đang sử dụng gói cước hội viên.'}
                  </Text>
                )}
              </View>
            </View>

            {/* Pricing Cards */}
            {isLoadingPlans ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#5D1C34" />
                <Text className="mt-3 text-[13px] text-[#6B7280]">Đang tải thông tin gói cước...</Text>
              </View>
            ) : (
              plans.map((plan: PlanCardData) => {
                const isCurrent = currentTier === plan.id;
                const isVip = plan.id === 'VIP';
                const isMember = plan.id === 'MEMBER';
                const isDowngradeDisabled =
                  isMember && currentTier === 'VIP' && scheduledSub !== null;

                return (
                  <View
                    key={plan.id}
                    className={`relative rounded-3xl p-6 mb-6 shadow-sm ${
                      plan.isPopular
                        ? 'bg-white border-2 border-[#5D1C34] shadow-md shadow-[#5D1C34]/10'
                        : isVip
                        ? 'bg-[#FDFBF7] border border-[#A67D44]/50'
                        : 'bg-white border border-[#ECE8E3]'
                    }`}
                  >
                    {/* Floating Pill Badge */}
                    {plan.badge && (
                      <View
                        className={`absolute -top-3.5 self-center px-4 py-1 rounded-full shadow-xs ${
                          plan.isPopular ? 'bg-[#5D1C34]' : 'bg-[#A67D44]'
                        }`}
                      >
                        <Text className="text-[12px] font-bold text-white">
                          {plan.badge}
                        </Text>
                      </View>
                    )}

                    {/* Title & Desc */}
                    <View className="mb-4">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[22px] font-bold text-[#5D1C34]">
                          {plan.name}
                        </Text>
                        {isVip && <Crown size={18} color="#A67D44" />}
                      </View>
                      <Text className="text-[13px] text-[#6B7280] mt-1 leading-5">
                        {plan.description}
                      </Text>
                    </View>

                    {/* Price */}
                    <View className="pb-5 border-b border-[#F3F4F6]">
                      <View className="flex-row items-baseline gap-1.5">
                        <Text className="text-[34px] font-bold text-[#5D1C34] tracking-tight">
                          {plan.priceText}
                        </Text>
                        <Text className="text-[14px] text-[#6B7280] font-medium">
                          {plan.periodText}
                        </Text>
                      </View>
                    </View>

                    {/* Checklist */}
                    <View className="mt-5 space-y-3 mb-2">
                      <Text className="text-[11px] font-bold text-[#9CA3AF] tracking-wider uppercase mb-1">
                        QUYỀN LỢI GÓI CƯỚC:
                      </Text>
                      {plan.features.map((feat, idx) => (
                        <View key={idx} className="flex-row items-center gap-3 py-0.5">
                          <View
                            className={`w-5 h-5 rounded-full items-center justify-center shrink-0 ${
                              feat.highlight
                                ? 'bg-[#5D1C34]'
                                : 'bg-[#F3F4F6]'
                            }`}
                          >
                            <Check
                              size={12}
                              color={feat.highlight ? '#FFFFFF' : '#6B7280'}
                              strokeWidth={3}
                            />
                          </View>
                          <Text
                            className={`text-[13px] flex-1 ${
                              feat.highlight
                                ? 'font-bold text-[#1B1C1B]'
                                : 'text-[#4B5563]'
                            }`}
                          >
                            {feat.text}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Action Button */}
                    <View className="mt-6">
                      {plan.id === 'FREE' ? (
                        <View className="w-full py-3.5 bg-[#EFECE6] rounded-xl items-center justify-center">
                          <Text className="text-[14px] font-semibold text-[#6B7280]">
                            {isCurrent ? 'Gói hiện tại của bạn' : 'Mặc định khi đăng ký'}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={isCheckingOut || isDowngradeDisabled}
                          onPress={() => handleUpgrade(plan.id as 'MEMBER' | 'VIP')}
                          className={`w-full py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-sm ${
                            isVip
                              ? 'bg-[#783E2D]'
                              : 'bg-[#5D1C34]'
                          } ${isDowngradeDisabled ? 'opacity-50' : 'active:opacity-90'}`}
                        >
                          {isCheckingOut ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : isDowngradeDisabled ? (
                            <Text className="text-[14px] font-bold text-white">
                              Đã lên lịch chuyển gói
                            </Text>
                          ) : isCurrent ? (
                            <>
                              <RefreshCw size={16} color="#FFFFFF" />
                              <Text className="text-[14px] font-bold text-white">
                                Gia hạn thêm 30 ngày
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text className="text-[14px] font-bold text-white">
                                {plan.ctaText}
                              </Text>
                              <ArrowRight size={16} color="#FFFFFF" />
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {/* ── Feature Comparison Table ── */}
            <View className="bg-white rounded-3xl p-5 border border-[#ECE8E3] shadow-sm mb-6 mt-2">
              <Text className="text-[20px] font-bold text-[#5D1C34] mb-4 leading-tight">
                So sánh chi tiết hạn mức tính năng AI
              </Text>

              {/* Table Header */}
              <View className="flex-row border-b border-[#ECE8E3] pb-3 mb-1">
                <Text className="w-[32%] text-[12px] font-semibold text-[#6B7280]">
                  Tính năng AI
                </Text>
                <Text className="w-[20%] text-[12px] font-semibold text-[#6B7280] text-center">
                  Gói FREE
                </Text>
                <Text className="w-[24%] text-[12px] font-bold text-[#5D1C34] text-center">
                  Gói MEMBER{'\n'}(34k)
                </Text>
                <Text className="w-[24%] text-[12px] font-bold text-[#A67D44] text-center">
                  Gói VIP{'\n'}(99k)
                </Text>
              </View>

              {/* Table Rows */}
              {QUOTA_COMPARISON.map((row, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center border-b border-[#F3F4F6] py-3.5"
                >
                  <Text className="w-[32%] text-[12px] font-semibold text-[#1B1C1B] leading-4 pr-1">
                    {row.featureName}
                  </Text>
                  <Text className="w-[20%] text-[11.5px] text-[#6B7280] text-center">
                    {row.free}
                  </Text>
                  <Text className="w-[24%] text-[12px] font-bold text-[#5D1C34] text-center">
                    {row.member}
                  </Text>
                  <Text className="w-[24%] text-[12px] font-bold text-[#A67D44] text-center">
                    {row.vip}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── FAQ Section ── */}
            <View className="bg-white rounded-3xl p-6 border border-[#ECE8E3] shadow-sm mb-6">
              <Text className="text-[20px] font-bold text-[#5D1C34] text-center mb-6">
                Câu hỏi thường gặp về gói cước
              </Text>

              {SUBSCRIPTION_FAQS.map((faq, idx) => (
                <View key={idx} className={idx < SUBSCRIPTION_FAQS.length - 1 ? 'mb-5' : ''}>
                  <Text className="text-[14px] font-bold text-[#5D1C34] mb-1.5 leading-snug">
                    {faq.question}
                  </Text>
                  <Text className="text-[13px] text-[#4B5563] leading-5">
                    {faq.answer}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── Footer ── */}
            <View className="items-center mt-2 mb-6">
              <Text className="text-[12px] text-[#9CA3AF] mb-2">
                © 2026 StAle. All rights reserved.
              </Text>
              <View className="flex-row gap-5">
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('Policy', { type: 'terms' })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-[12px] font-medium text-[#6B7280]">Điều khoản</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('Policy', { type: 'privacy' })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-[12px] font-medium text-[#6B7280]">Bảo mật</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('Policy', { type: 'return' })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-[12px] font-medium text-[#6B7280]">Đổi trả &amp; Hỗ trợ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ─────────────────── TAB 2: GÓI CỦA TÔI ─────────────────── */}
        {activeTab === 'current' && (
          <View className="space-y-4">
            {isLoadingSub ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#5D1C34" />
                <Text className="mt-3 text-[13px] text-[#6B7280]">Đang tải thông tin gói của bạn...</Text>
              </View>
            ) : (
              <View className="bg-white rounded-3xl border border-[#ECE8E3] p-6 shadow-sm">
                <View className="flex-row items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4">
                  <View>
                    <Text className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      Gói hiện tại
                    </Text>
                    <Text className="text-[22px] font-bold text-[#5D1C34]">
                      {currentTier}
                    </Text>
                  </View>
                  {renderHistoryStatusBadge(currentSub?.status || (currentTier === 'FREE' ? 'FREE' : 'ACTIVE'))}
                </View>

                {expirationInfo && (
                  <View className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#ECE8E3] mb-4 space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-[13px] text-[#6B7280]">Ngày hết hạn:</Text>
                      <Text className="text-[13px] font-bold text-[#1B1C1B]">
                        {expirationInfo.formattedDate}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-[13px] text-[#6B7280]">Thời gian còn lại:</Text>
                      <Text className="text-[13px] font-bold text-[#5D1C34]">
                        {expirationInfo.daysRemaining} ngày
                      </Text>
                    </View>
                  </View>
                )}

                {/* Auto Renew Toggle */}
                {currentSub && (
                  <View className="flex-row items-center justify-between py-3 border-t border-[#F3F4F6] mt-2">
                    <View className="flex-1 pr-4">
                      <Text className="text-[14px] font-bold text-[#1B1C1B]">
                        Tự động gia hạn
                      </Text>
                      <Text className="text-[12px] text-[#6B7280] mt-0.5">
                        Tự động gia hạn khi kết thúc chu kỳ 30 ngày
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleToggleAutoRenew}
                      disabled={isCancelling || isResuming}
                      className={`px-3 py-1.5 rounded-lg border ${
                        currentSub.autoRenew
                          ? 'border-red-200 bg-red-50'
                          : 'border-[#5D1C34] bg-[#5D1C34]/10'
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-bold ${
                          currentSub.autoRenew ? 'text-red-700' : 'text-[#5D1C34]'
                        }`}
                      >
                        {currentSub.autoRenew ? 'Tắt gia hạn' : 'Bật gia hạn'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Scheduled Change Notice */}
                {scheduledSub && (
                  <View className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Clock size={16} color="#1E40AF" />
                      <Text className="text-[13px] font-bold text-blue-900">
                        Lịch chuyển gói: {scheduledSub.tier}
                      </Text>
                    </View>
                    <Text className="text-[12px] text-blue-800 leading-4">
                      Gói {scheduledSub.tier} sẽ tự động kích hoạt sau khi gói hiện tại hết hạn.
                    </Text>
                    <TouchableOpacity
                      onPress={handleCancelScheduled}
                      disabled={isCancellingScheduled}
                      className="mt-3 self-start px-3 py-1 rounded-lg border border-red-300 bg-white"
                    >
                      <Text className="text-[11px] font-bold text-red-600">
                        {isCancellingScheduled ? 'Đang hủy...' : 'Hủy lịch chuyển gói'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ─────────────────── TAB 3: LỊCH SỬ ĐĂNG KÝ ─────────────────── */}
        {activeTab === 'history' && (
          <View>
            {isLoadingHistory ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#5D1C34" />
                <Text className="mt-3 text-[13px] text-[#6B7280]">Đang tải lịch sử...</Text>
              </View>
            ) : !history || history.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center border border-[#ECE8E3] shadow-sm">
                <Clock size={40} color="#9CA3AF" />
                <Text className="text-[15px] font-bold text-[#1B1C1B] mt-3">
                  Chưa có lịch sử đăng ký
                </Text>
                <Text className="text-[13px] text-[#6B7280] text-center mt-1">
                  Các gói dịch vụ bạn đã thanh toán sẽ được lưu trữ và hiển thị tại đây.
                </Text>
              </View>
            ) : (
              history.map((item: any) => (
                <View
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-[#ECE8E3] mb-3 shadow-xs"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[15px] font-bold text-[#1B1C1B]">
                        Gói {item.tier}
                      </Text>
                      {renderHistoryStatusBadge(item.status)}
                    </View>
                    <Text className="text-[14px] font-bold text-[#5D1C34]">
                      {formatCurrency(item.amount || (item.tier === 'MEMBER' ? 34000 : 99000))}
                    </Text>
                  </View>

                  <View className="flex-row justify-between text-[12px] text-[#6B7280] pt-2 border-t border-[#F3F4F6]">
                    <Text className="text-[12px] text-[#6B7280]">
                      Cổng: {item.provider || 'SEPAY'}
                    </Text>
                    <Text className="text-[12px] text-[#6B7280]">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
