import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  FileText,
  History,
  Lock,
  LogOut,
  MapPin,
  Package,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  X,
} from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import { ToneLabel } from '@/features/orders/components/ToneLabel';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { ORDER_STATUS_CONFIG } from '@/features/orders/utils/order-status';
import type { ProfileStackParamList, RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/format';
import { usersApi, type UserQuotaResponse } from '../api/users.api';
import { POLICY_NAV_ITEMS } from '../constants/policies/policy-nav';
import type { PolicyType } from '../types/policy';
import type { IUser } from '../types/user';

type ProfileNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CATEGORY_LABELS: Record<string, string> = {
  UPPER: 'Áo',
  LOWER: 'Quần & váy',
  FULL_BODY: 'Đồ liền',
};

type NavRowIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const POLICY_ICONS: Record<PolicyType, NavRowIcon> = {
  return: RotateCcw,
  warranty: ShieldCheck,
  'size-guide': Ruler,
  privacy: Lock,
  terms: FileText,
};

const labelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
// Nút nhỏ trong hàng thông tin (web: accountButtonClassName(..., 'sm')), cao 44px cho vùng chạm.
const smallOutlineButtonClass =
  'h-11 items-center justify-center rounded-subtle border border-landing-line px-3.5 active:opacity-70';
const smallButtonLabelClass =
  'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-4 border-t border-landing-line pt-6">
      <View className="flex-row items-end justify-between gap-4">
        <View className="flex-1">
          <Text className="font-display text-[22px] leading-tight text-landing-obsidian">
            {title}
          </Text>
          {description ? (
            <Text className="mt-1 font-sans text-body-sm leading-relaxed text-landing-muted">
              {description}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

function LinkAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-11 flex-row items-center gap-1.5 active:opacity-70"
    >
      <Text className="font-sans text-body-sm text-oxblood">{label}</Text>
      <ArrowRight size={13} strokeWidth={1.75} color={COLORS.oxblood} />
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  action,
  muted,
  mono,
  note,
  valueAccessibilityLabel,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
  muted?: boolean;
  mono?: boolean;
  note?: { text: string; className: string };
  valueAccessibilityLabel?: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-landing-line/70 py-3.5">
      <Text className="font-sans text-body-sm text-landing-muted">{label}</Text>
      <View className="flex-1 items-end">
        <Text
          numberOfLines={1}
          accessibilityLabel={valueAccessibilityLabel}
          className={`text-right text-body-md ${mono ? 'font-mono' : 'font-sans'} ${
            muted ? 'text-landing-muted' : 'text-landing-obsidian'
          }`}
        >
          {value}
        </Text>
        {note ? (
          <Text className={`mt-0.5 font-sans text-[12px] ${note.className}`}>{note.text}</Text>
        ) : null}
      </View>
      {action ? <View className="shrink-0">{action}</View> : null}
    </View>
  );
}

function QuotaMeter({ label, quota }: { label: string; quota?: UserQuotaResponse }) {
  if (!quota) {
    return (
      <View className="gap-2 border-b border-landing-line/60 py-3.5">
        <View className="h-4 w-40 bg-taupe/40" />
      </View>
    );
  }

  const unlimited = quota.unlimited || quota.limit === null;
  const limit = quota.limit ?? 0;
  const notIncluded = !unlimited && limit === 0;
  const percent =
    unlimited || notIncluded
      ? 0
      : Math.min(100, Math.round((quota.used / limit) * 100));

  return (
    <View className="gap-2 border-b border-landing-line/60 py-3.5">
      <View className="flex-row items-baseline justify-between gap-4">
        <Text className="font-sans text-body-sm text-landing-obsidian">{label}</Text>
        <Text
          className={`font-mono text-[12px] ${
            notIncluded ? 'text-landing-muted' : 'text-landing-obsidian'
          }`}
        >
          {unlimited
            ? 'Không giới hạn'
            : notIncluded
              ? 'Không có trong gói'
              : `${quota.used} / ${limit}`}
        </Text>
      </View>
      {!unlimited && !notIncluded ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`${label}: đã dùng ${quota.used} trên ${limit} lượt`}
          accessibilityValue={{ min: 0, max: limit, now: quota.used }}
          className="h-[3px] overflow-hidden bg-taupe/45"
        >
          <View
            style={{ width: `${percent}%` }}
            className="h-full bg-oxblood"
          />
        </View>
      ) : null}
    </View>
  );
}

function NavRow({
  icon: Icon,
  label,
  description,
  badge,
  onPress,
}: {
  icon: NavRowIcon;
  label: string;
  description: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={onPress}
      className="min-h-11 flex-row items-center gap-3 border-b border-landing-line/70 py-3.5 active:opacity-70"
    >
      <View className="h-9 w-9 shrink-0 items-center justify-center border border-landing-line">
        <Icon size={16} strokeWidth={1.5} color={COLORS.oxblood} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans text-body-md font-medium text-landing-obsidian">
            {label}
          </Text>
          {badge ? (
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-oxblood">
              {badge}
            </Text>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          className="mt-0.5 font-sans text-body-sm text-landing-muted"
        >
          {description}
        </Text>
      </View>
      <ArrowRight size={15} strokeWidth={1.75} color={COLORS.muted} />
    </Pressable>
  );
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, logout, refreshUser } = useAuth();
  const { hasMeasurement, byCategory, isLoading: measurementsLoading } =
    useMeasurementsCompleteness();
  const { orders, isLoading: ordersLoading } = useOrders();

  const profileQuery = useQuery<IUser>({
    queryKey: ['users', 'me'],
    queryFn: ({ signal }) => usersApi.getMe({ signal }),
    staleTime: 30000,
  });

  const { data: tryOnQuota } = useQuery<UserQuotaResponse>({
    queryKey: ['quota', 'TRY_ON'],
    queryFn: ({ signal }) => usersApi.getQuota('TRY_ON', { signal }),
    staleTime: 30000,
  });
  const { data: stylistQuota } = useQuery<UserQuotaResponse>({
    queryKey: ['quota', 'STYLIST'],
    queryFn: ({ signal }) => usersApi.getQuota('STYLIST', { signal }),
    staleTime: 30000,
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const profile = profileQuery.data;
  const name = profile?.name || user?.name || '';
  const email = profile?.email || user?.email || '';
  const tier = String(profile?.tier || user?.tier || 'FREE').toUpperCase();
  const tierLabel =
    tier === 'VIP' ? 'VIP' : tier === 'MEMBER' ? 'Member' : 'Miễn phí';
  const tierExpiresAt = formatDate(
    (profile as any)?.tierExpiresAt ?? (user as any)?.tierExpiresAt,
  );
  const joinedAt = formatDate(profile?.createdAt ?? user?.createdAt);
  const isVerified = (profile as any)?.isVerified ?? user?.isVerified;

  const updateName = useMutation({
    mutationFn: (nextName: string) => usersApi.updateMe({ name: nextName }),
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      setEditingName(false);
      setNameError(null);
    },
    onError: () => {
      setNameError('Không lưu được họ và tên. Vui lòng thử lại.');
    },
  });

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const quotaResetAt = tryOnQuota?.resetAt ? new Date(tryOnQuota.resetAt) : null;

  const startEditingName = () => {
    setNameDraft(name);
    setNameError(null);
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError('Nhập họ và tên.');
      return;
    }
    updateName.mutate(trimmed);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
    } catch {
      Alert.alert('Không thể đăng xuất', 'Vui lòng thử lại.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-lg pb-giant pt-lg"
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View className="gap-2 border-b border-landing-line pb-5">
          <Text className={labelClass}>Tài khoản</Text>
          <Text
            accessibilityRole="header"
            className="font-display text-[30px] leading-tight text-landing-obsidian"
          >
            Hồ sơ của tôi
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Thông tin tài khoản, gói thành viên và mức sẵn sàng của số đo cho đơn may.
          </Text>
        </View>

        {/* Account info */}
        <Section title="Thông tin tài khoản">
          {editingName ? (
            <View className="gap-2 border-b border-landing-line py-3.5">
              <Text className="font-sans text-body-sm text-landing-muted">
                Họ và tên
              </Text>
              <TextInput
                value={nameDraft}
                onChangeText={(value) => {
                  setNameDraft(value);
                  setNameError(null);
                }}
                autoFocus
                maxLength={100}
                editable={!updateName.isPending}
                placeholder="Họ và tên"
                placeholderTextColor={COLORS.muted}
                accessibilityLabel="Họ và tên"
                autoComplete="name"
                className="h-11 rounded-subtle border border-landing-line bg-ivory/80 px-3 font-sans text-body-md text-landing-obsidian"
              />
              {nameError ? (
                <Text accessibilityRole="alert" className="font-sans text-body-sm text-danger">
                  {nameError}
                </Text>
              ) : null}
              <View className="flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  disabled={updateName.isPending}
                  onPress={saveName}
                  className="h-11 items-center justify-center rounded-subtle bg-oxblood px-4 active:opacity-90"
                >
                  <Text className={`${smallButtonLabelClass} text-landing-paper`}>
                    {updateName.isPending ? 'Đang lưu' : 'Lưu'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={updateName.isPending}
                  onPress={() => setEditingName(false)}
                  className={smallOutlineButtonClass}
                >
                  <Text className={`${smallButtonLabelClass} text-landing-obsidian`}>
                    Hủy
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <InfoRow
              label="Họ và tên"
              value={name || 'Chưa có'}
              muted={!name}
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sửa họ và tên"
                  onPress={startEditingName}
                  className={smallOutlineButtonClass}
                >
                  <Text className={`${smallButtonLabelClass} text-landing-obsidian`}>
                    Sửa
                  </Text>
                </Pressable>
              }
            />
          )}

          <InfoRow
            label="Email"
            value={email || 'Chưa có'}
            muted={!email}
            note={
              isVerified !== undefined
                ? {
                    text: isVerified ? 'Đã xác minh' : 'Chưa xác minh',
                    className: isVerified ? 'text-sage-ink' : 'text-brass-ink',
                  }
                : undefined
            }
          />
          <InfoRow
            label="Mật khẩu"
            value="••••••••"
            valueAccessibilityLabel="Đã ẩn"
            muted
            mono
            action={
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('ChangePassword')}
                className={smallOutlineButtonClass}
              >
                <Text className={`${smallButtonLabelClass} text-landing-obsidian`}>
                  Đổi mật khẩu
                </Text>
              </Pressable>
            }
          />
          {joinedAt ? (
            <InfoRow label="Ngày tham gia" value={joinedAt} mono />
          ) : null}
          <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
            Số điện thoại và địa chỉ giao hàng nằm trong Sổ địa chỉ.
          </Text>
        </Section>

        {/* Membership */}
        <Section
          title="Gói thành viên"
          action={
            <LinkAction
              label="Xem các gói"
              onPress={() => navigation.navigate('SubscriptionPlans', { tab: 'plans' })}
            />
          }
        >
          <View className="gap-1">
            <Text className={labelClass}>Gói hiện tại</Text>
            <Text className="mt-2 font-display text-[44px] leading-none text-oxblood">
              {tierLabel}
            </Text>
            <Text className="mt-2 font-sans text-body-sm text-landing-muted">
              {tier === 'FREE'
                ? 'Gói miễn phí, không có hạn dùng.'
                : tierExpiresAt
                  ? `Hiệu lực đến ${tierExpiresAt}.`
                  : 'Đang hoạt động.'}
            </Text>
          </View>

          <View className="mt-2">
            <Text className={labelClass}>Lượt dùng hôm nay</Text>
            <View className="mt-1">
              <QuotaMeter label="Thử đồ AI" quota={tryOnQuota} />
              <QuotaMeter label="AI Stylist" quota={stylistQuota} />
            </View>
            {quotaResetAt && !Number.isNaN(quotaResetAt.getTime()) ? (
              <Text className="mt-2 font-sans text-[12px] text-landing-muted">
                Làm mới lúc{' '}
                <Text className="font-mono">
                  {quotaResetAt.toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </Text>
                .
              </Text>
            ) : null}
          </View>
        </Section>

        {/* Measurements readiness */}
        <Section
          title="Số đo may đo"
          description="Mỗi nhóm trang phục cần một bộ số đo riêng trước khi đặt may."
          action={
            <LinkAction
              label="Cập nhật số đo"
              onPress={() => navigation.navigate('Measurements')}
            />
          }
        >
          {measurementsLoading ? (
            <View accessibilityLabel="Đang tải tình trạng số đo" className="gap-3">
              {[0, 1, 2].map((key) => (
                <View key={key} className="h-5 w-2/3 bg-taupe/40" />
              ))}
            </View>
          ) : !hasMeasurement ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Measurements')}
              className="border-l-2 border-brass bg-ivory px-4 py-3 active:opacity-80"
            >
              <Text className="font-sans text-body-sm leading-relaxed text-landing-obsidian">
                Bạn chưa nhập số đo. Đơn may đo cần số đo trước khi đặt.
              </Text>
            </Pressable>
          ) : (
            <View>
              {byCategory.map((category) => (
                <View
                  key={category.category}
                  className="flex-row items-start justify-between gap-4 border-b border-landing-line/70 py-3"
                >
                  <Text className="font-sans text-body-sm text-landing-obsidian">
                    {CATEGORY_LABELS[category.category] ?? category.category}
                  </Text>
                  {category.complete ? (
                    <View className="flex-row items-center gap-1.5">
                      <Check size={13} strokeWidth={2} color={COLORS.sageInk} />
                      <Text className="font-sans text-body-sm text-sage-ink">
                        Đủ số đo để đặt may
                      </Text>
                    </View>
                  ) : (
                    <Text className="flex-1 text-right font-sans text-body-sm text-brass-ink">
                      Thiếu {category.missing.map((field) => field.label.toLowerCase()).join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Recent orders */}
        <Section
          title="Đơn gần đây"
          action={
            <LinkAction
              label="Tất cả đơn hàng"
              onPress={() => navigation.navigate('Orders')}
            />
          }
        >
          {ordersLoading ? (
            <View accessibilityLabel="Đang tải đơn hàng" className="gap-4">
              {[0, 1].map((key) => (
                <View key={key} className="h-12 bg-taupe/30" />
              ))}
            </View>
          ) : recentOrders.length === 0 ? (
            <Text className="font-sans text-body-sm text-landing-muted">
              Bạn chưa có đơn hàng nào.
            </Text>
          ) : (
            <View>
              {recentOrders.map((order) => {
                // GET /orders trả orderCode và totalVnd/totalAmount (như getOrderCode/getOrderTotal của web).
                const code = `ORD-${order.orderCode ?? order.orderNumber ?? order.id}`;
                const total = order.totalVnd ?? order.totalAmount ?? order.total;
                const status = ORDER_STATUS_CONFIG[order.status] ?? {
                  label: String(order.status ?? ''),
                  tone: 'closed' as const,
                };
                const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                return (
                  <Pressable
                    key={String(order.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Xem đơn ${code}`}
                    onPress={() =>
                      navigation.navigate('OrderDetail', { orderId: String(order.id) })
                    }
                    className="gap-1.5 border-b border-landing-line/70 py-4 active:opacity-70"
                  >
                    <View className="flex-row items-baseline justify-between gap-4">
                      <Text className="font-mono text-[13px] text-landing-obsidian">{code}</Text>
                      <Text className="font-mono text-[13px] text-oxblood">
                        {formatCurrency(total)}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <ToneLabel tone={status.tone} label={status.label} />
                      <Text className="font-sans text-[12px] text-landing-muted">
                        {formatDate(order.createdAt)} · <Text className="font-mono">{itemCount}</Text> món
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Section>

        {/* Account navigation */}
        <Section title="Quản lý">
          <View>
            <NavRow
              icon={MapPin}
              label="Sổ địa chỉ"
              description="Thêm, sửa và chọn địa chỉ giao hàng mặc định"
              onPress={() => navigation.navigate('Addresses')}
            />
            <NavRow
              icon={Ruler}
              label="Số đo & chi tiết"
              description="Cập nhật số đo cho đơn may"
              badge={!hasMeasurement ? 'Mới' : undefined}
              onPress={() => navigation.navigate('Measurements')}
            />
            <NavRow
              icon={Package}
              label="Đơn hàng của tôi"
              description="Theo dõi và quản lý đơn hàng"
              onPress={() => navigation.navigate('Orders')}
            />
            <NavRow
              icon={RotateCcw}
              label="Đổi trả & hoàn tiền"
              description="Theo dõi yêu cầu báo lỗi, hàng hoàn và tiền hoàn"
              onPress={() => navigation.navigate('Returns')}
            />
            <NavRow
              icon={Star}
              label="Đánh giá của tôi"
              description="Xem và quản lý đánh giá sản phẩm đã viết"
              onPress={() => navigation.navigate('MyReviews')}
            />
            <NavRow
              icon={History}
              label="Lịch sử thử đồ"
              description="Xem lại và tải ảnh thử đồ AI của bạn"
              onPress={() => navigation.navigate('TryOnHistory')}
            />
            <NavRow
              icon={Sparkles}
              label="Lịch sử AI Stylist"
              description="Các lần tư vấn phong cách đã thực hiện"
              onPress={() => navigation.navigate('StylistHistory')}
            />
            <NavRow
              icon={Wallet}
              label="Gói thành viên"
              description="Bảng giá, gia hạn và lịch sử giao dịch gói"
              onPress={() => navigation.navigate('SubscriptionPlans', { tab: 'plans' })}
            />
          </View>
        </Section>

        <Section title="Chính sách">
          <View>
            {POLICY_NAV_ITEMS.map((item) => (
              <NavRow
                key={item.type}
                icon={POLICY_ICONS[item.type]}
                label={item.label}
                description={item.description}
                onPress={() => navigation.navigate('Policy', { type: item.type })}
              />
            ))}
          </View>
        </Section>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowLogoutModal(true)}
          className="h-11 flex-row items-center justify-center gap-2 rounded-subtle border border-landing-line active:opacity-70"
        >
          <LogOut size={16} strokeWidth={1.75} color={COLORS.obsidian} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
            Đăng xuất
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        navigationBarTranslucent
        statusBarTranslucent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng hộp thoại"
            disabled={isLoggingOut}
            onPress={() => setShowLogoutModal(false)}
            className="absolute inset-0 bg-landing-obsidian/45"
          />
          <View
            className="w-full max-w-[420px] self-center border-t border-landing-line bg-landing-paper px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-start justify-between gap-3">
              <Text
                accessibilityRole="header"
                className="flex-1 font-display text-[24px] leading-tight text-landing-obsidian"
              >
                Xác nhận đăng xuất
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                accessibilityState={{ disabled: isLoggingOut }}
                disabled={isLoggingOut}
                onPress={() => setShowLogoutModal(false)}
                className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
              >
                <X size={18} strokeWidth={1.75} color={COLORS.muted} />
              </Pressable>
            </View>
            <Text className="mt-3 font-sans text-body-sm leading-relaxed text-landing-muted">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình?
            </Text>

            <View className="mt-6 gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đăng xuất"
                accessibilityState={{ disabled: isLoggingOut }}
                disabled={isLoggingOut}
                onPress={() => void confirmLogout()}
                className="h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90"
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={COLORS.paper} />
                ) : (
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                    Đăng xuất
                  </Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Giữ lại"
                disabled={isLoggingOut}
                onPress={() => setShowLogoutModal(false)}
                className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                  Giữ lại
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
