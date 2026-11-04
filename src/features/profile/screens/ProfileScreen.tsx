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
} from 'lucide-react-native';
import { AppHeader } from '@/components/common/AppHeader';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import { useOrders } from '@/features/orders/hooks/use-orders';
import { EOrderStatus } from '@/features/orders/types/order';
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
  FULL_BODY: 'Bộ liền',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  [EOrderStatus.PENDING]: 'Chờ xử lý',
  [EOrderStatus.PENDING_PAYMENT]: 'Chờ thanh toán',
  [EOrderStatus.CONFIRMED]: 'Đã xác nhận',
  [EOrderStatus.PROCESSING]: 'Đang chuẩn bị',
  [EOrderStatus.SHIPPING]: 'Đang giao',
  [EOrderStatus.DELIVERED]: 'Đã giao',
  [EOrderStatus.COMPLETED]: 'Hoàn thành',
  [EOrderStatus.CANCELLED]: 'Đã hủy',
  [EOrderStatus.REFUND_PENDING]: 'Chờ hoàn tiền',
  [EOrderStatus.REFUNDED]: 'Đã hoàn tiền',
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
const mutedLabelClass =
  'font-sans text-[11px] uppercase tracking-[0.16em] text-landing-muted';

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
      className="min-h-9 flex-row items-center gap-1 active:opacity-70"
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
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-landing-line py-3.5">
      <Text className="font-sans text-body-sm text-landing-muted">{label}</Text>
      <View className="flex-1 items-end">
        <Text
          numberOfLines={1}
          className={`text-right font-sans text-body-md ${
            muted ? 'text-landing-muted' : 'text-landing-obsidian'
          }`}
        >
          {value}
        </Text>
      </View>
      {action ? <View className="shrink-0">{action}</View> : null}
    </View>
  );
}

function QuotaMeter({ label, quota }: { label: string; quota?: UserQuotaResponse }) {
  if (!quota) {
    return (
      <View className="gap-2 border-b border-landing-line py-3.5">
        <View className="h-3 w-32 bg-taupe/40" />
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
    <View className="gap-2 border-b border-landing-line py-3.5">
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
        <View className="h-[3px] overflow-hidden bg-taupe/45">
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
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-landing-line py-3.5 active:opacity-70"
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
            <Text className="border border-oxblood/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-oxblood">
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
    tier === 'VIP' ? 'VIP' : tier === 'MEMBER' ? 'Member' : 'Free';
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
            className="font-display text-headline-lg text-landing-obsidian"
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
                className="h-11 rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 font-sans text-body-md text-landing-obsidian"
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
                  className="h-10 items-center justify-center rounded-subtle bg-oxblood px-4 active:opacity-90"
                >
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                    {updateName.isPending ? 'Đang lưu' : 'Lưu'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={updateName.isPending}
                  onPress={() => setEditingName(false)}
                  className="h-10 items-center justify-center rounded-subtle border border-landing-line px-4 active:bg-ivory"
                >
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
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
                  onPress={startEditingName}
                  className="h-9 items-center justify-center rounded-subtle border border-landing-line px-3 active:bg-ivory"
                >
                  <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
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
          />
          {isVerified !== undefined ? (
            <InfoRow
              label="Xác minh"
              value={isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
              muted={!isVerified}
            />
          ) : null}
          <InfoRow
            label="Mật khẩu"
            value="••••••••"
            muted
            action={
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('ChangePassword')}
                className="h-9 items-center justify-center rounded-subtle border border-landing-line px-3 active:bg-ivory"
              >
                <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                  Đổi mật khẩu
                </Text>
              </Pressable>
            }
          />
          {joinedAt ? (
            <InfoRow label="Ngày tham gia" value={joinedAt} />
          ) : null}
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
            <Text className={mutedLabelClass}>Gói hiện tại</Text>
            <Text className="mt-1 font-display text-[40px] leading-none text-oxblood">
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
            <Text className={mutedLabelClass}>Lượt dùng hôm nay</Text>
            <View className="mt-1">
              <QuotaMeter label="Thử đồ AI" quota={tryOnQuota} />
              <QuotaMeter label="AI Stylist" quota={stylistQuota} />
            </View>
          </View>
        </Section>

        {/* Measurements readiness */}
        <Section
          title="Số đo may đo"
          description="Mỗi nhóm trang phục cần một bộ số đo riêng trước khi đặt may."
          action={
            <LinkAction
              label="Cập nhật"
              onPress={() => navigation.navigate('Measurements')}
            />
          }
        >
          {measurementsLoading ? (
            <Text className="font-sans text-body-sm text-landing-muted">
              Đang tải tình trạng số đo…
            </Text>
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
                  className="flex-row items-start justify-between gap-4 border-b border-landing-line py-3"
                >
                  <Text className="font-sans text-body-sm text-landing-obsidian">
                    {CATEGORY_LABELS[category.category] ?? category.category}
                  </Text>
                  {category.complete ? (
                    <View className="flex-row items-center gap-1.5">
                      <Check size={13} strokeWidth={2} color={COLORS.sageInk} />
                      <Text className="font-sans text-body-sm text-sage-ink">
                        Đủ số đo
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
              label="Tất cả"
              onPress={() => navigation.navigate('Orders')}
            />
          }
        >
          {ordersLoading ? (
            <Text className="font-sans text-body-sm text-landing-muted">
              Đang tải đơn hàng…
            </Text>
          ) : recentOrders.length === 0 ? (
            <Text className="font-sans text-body-sm text-landing-muted">
              Bạn chưa có đơn hàng nào.
            </Text>
          ) : (
            <View>
              {recentOrders.map((order) => (
                <Pressable
                  key={String(order.id)}
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('OrderDetail', { orderId: String(order.id) })
                  }
                  className="gap-1.5 border-b border-landing-line py-3.5 active:opacity-70"
                >
                  <View className="flex-row items-baseline justify-between gap-4">
                    <Text className="font-mono text-[13px] text-landing-obsidian">
                      {order.orderNumber}
                    </Text>
                    <Text className="font-mono text-[13px] text-oxblood">
                      {formatCurrency(order.total)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="font-sans text-[11px] uppercase tracking-[0.12em] text-brass-ink">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Text>
                    <Text className="font-sans text-[11px] text-landing-muted">
                      {formatDate(order.createdAt)} · {order.items.length} món
                    </Text>
                  </View>
                </Pressable>
              ))}
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
          className="h-12 flex-row items-center justify-center gap-2 rounded-subtle border border-landing-line active:bg-ivory"
        >
          <LogOut size={16} strokeWidth={1.75} color={COLORS.muted} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
            Đăng xuất
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-landing-obsidian/60 px-5">
          <View className="w-full max-w-[360px] gap-3 rounded-subtle border border-landing-line bg-landing-paper p-6">
            <View className="h-12 w-12 items-center justify-center border border-landing-line">
              <LogOut size={22} strokeWidth={1.5} color={COLORS.oxblood} />
            </View>
            <Text className="font-display text-[22px] leading-tight text-landing-obsidian">
              Xác nhận đăng xuất
            </Text>
            <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình?
            </Text>

            <View className="mt-2 flex-row gap-2.5">
              <Pressable
                accessibilityRole="button"
                disabled={isLoggingOut}
                onPress={() => setShowLogoutModal(false)}
                className="h-11 flex-1 items-center justify-center rounded-subtle border border-landing-line active:bg-ivory"
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
                  Hủy
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isLoggingOut}
                onPress={() => void confirmLogout()}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90"
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={COLORS.paper} />
                ) : (
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-paper">
                    Đăng xuất
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
