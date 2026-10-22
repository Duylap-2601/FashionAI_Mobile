import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShoppingBag,
  Pencil,
  Crown,
  Lock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronRight,
  Ruler,
  MapPin,
  History,
  Sparkles,
  Camera,
  LogOut,
  Star,
  Clock,
  X,
  Check,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProfileStackParamList, RootStackParamList } from '@/navigation/types';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { useMeasurementsCompleteness } from '@/features/measurements/hooks/use-measurements-completeness';
import { usersApi, UserQuotaResponse } from '@/features/profile/api/users.api';

type ProfileNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ─── Addresses Modal ─────────────────────────────────────────────────────────
interface AddressesModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddressesModal: React.FC<AddressesModalProps> = ({ visible, onClose }) => {
  const queryClient = useQueryClient();
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => usersApi.getAddresses(),
    enabled: visible,
  });

  const handleSetDefault = async (id: string) => {
    try {
      await usersApi.setDefaultAddress(id);
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
    } catch {
      // Ignored for now
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[80%] rounded-t-3xl bg-white p-5 shadow-2xl">
          <View className="flex-row items-center justify-between pb-3.5 border-b border-[#F3F4F6] mb-4">
            <View className="flex-row items-center gap-2">
              <MapPin size={20} color="#5D1C34" />
              <Text className="text-[17px] font-bold text-[#1B1C1B]">Sổ địa chỉ giao hàng</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center"
            >
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#5D1C34" />
              <Text className="mt-3 text-[13px] text-[#6B7280]">Đang tải địa chỉ...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View className="py-12 items-center justify-center text-center">
              <MapPin size={40} color="#D1D5DB" />
              <Text className="mt-3 text-[15px] font-semibold text-[#374151]">Chưa có địa chỉ nào</Text>
              <Text className="mt-1 text-[13px] text-[#9CA3AF] text-center px-4">
                Địa chỉ giao hàng sẽ tự động được lưu khi bạn tiến hành đặt hàng tại quầy thanh toán.
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
              {addresses.map((addr: any) => (
                <View
                  key={addr.id}
                  className={`p-4 rounded-2xl border mb-3 ${
                    addr.isDefault
                      ? 'border-[#5D1C34] bg-[#5D1C34]/5'
                      : 'border-[#E5E7EB] bg-white'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[14px] font-bold text-[#1B1C1B]">
                        {addr.recipientName}
                      </Text>
                      {addr.isDefault && (
                        <View className="px-2 py-0.5 rounded-full bg-[#5D1C34] items-center justify-center">
                          <Text className="text-[10px] font-bold text-white">Mặc định</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[13px] text-[#6B7280]">{addr.phone}</Text>
                  </View>
                  <Text className="text-[13px] text-[#4B5563] mb-2 leading-5">
                    {addr.addressLine}
                    {addr.wardName ? `, ${addr.wardName}` : ''}
                    {addr.districtName ? `, ${addr.districtName}` : ''}
                    {addr.provinceName ? `, ${addr.provinceName}` : ''}
                  </Text>
                  {!addr.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(addr.id)}
                      className="self-start py-1 px-3 rounded-lg border border-[#D1D5DB] bg-white active:bg-[#F9FAFB]"
                    >
                      <Text className="text-[11px] font-semibold text-[#5D1C34]">
                        Đặt làm mặc định
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 h-11 rounded-xl bg-[#5D1C34] items-center justify-center"
          >
            <Text className="text-[14px] font-semibold text-white">Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Quota Progress Bar Component ───────────────────────────────────────────
interface QuotaBarProps {
  label: string;
  quota?: UserQuotaResponse;
}

const QuotaBar: React.FC<QuotaBarProps> = ({ label, quota }) => {
  if (!quota) return null;
  const { used = 0, limit = 0, unlimited = false } = quota;
  const remaining = unlimited ? '∞' : limit !== null ? Math.max(limit - used, 0) : 0;
  const pct = unlimited || !limit ? 100 : Math.min((used / limit) * 100, 100);

  const getBarColor = () => {
    if (unlimited) return 'bg-[#EAB308]';
    if (remaining === 0) return 'bg-[#DC2626]';
    if (pct >= 80) return 'bg-[#F59E0B]';
    return 'bg-[#10B981]';
  };

  return (
    <View className="mb-3.5">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-[13px] text-[#6B7280]">{label}</Text>
        <Text className="text-[13px] font-bold text-[#1B1C1B]">
          {unlimited ? '∞ không giới hạn' : `${remaining} còn lại`}
        </Text>
      </View>
      <View className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${getBarColor()}`}
          style={{ width: unlimited ? '100%' : `${pct}%` }}
        />
      </View>
    </View>
  );
};

// ─── Nav Card Component ──────────────────────────────────────────────────────
interface NavCardProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  desc: string;
  badge?: string;
  onPress: () => void;
}

const NavCard: React.FC<NavCardProps> = ({ icon: Icon, label, desc, badge, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="flex-row items-center p-4 bg-white border border-[#ECE8E3] rounded-2xl mb-3 shadow-sm active:bg-[#F9FAFB]"
  >
    <View className="w-11 h-11 rounded-2xl bg-[#F7F5F2] items-center justify-center mr-3.5 shrink-0">
      <Icon size={20} color="#5D1C34" />
    </View>
    <View className="flex-1 min-w-0">
      <View className="flex-row items-center gap-2">
        <Text className="text-[14px] font-bold text-[#1B1C1B]">{label}</Text>
        {badge && (
          <View className="px-2 py-0.5 bg-[#5D1C34] rounded-full">
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        )}
      </View>
      <Text className="text-[12px] text-[#6B7280] mt-0.5 leading-4" numberOfLines={1}>
        {desc}
      </Text>
    </View>
    <ChevronRight size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

// ─── Main Profile Screen ─────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const { hasMeasurement } = useMeasurementsCompleteness();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAddressesModal, setShowAddressesModal] = useState(false);

  const tier = (user?.tier || 'FREE').toUpperCase();

  // Fetch Quotas
  const { data: tryOnQuota } = useQuery<UserQuotaResponse>({
    queryKey: ['quota', 'TRY_ON'],
    queryFn: () => usersApi.getQuota('TRY_ON'),
    staleTime: 30000,
  });

  const { data: stylistQuota } = useQuery<UserQuotaResponse>({
    queryKey: ['quota', 'STYLIST'],
    queryFn: () => usersApi.getQuota('STYLIST'),
    staleTime: 30000,
  });

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
    } catch {
      // Ignored
    } finally {
      setIsLoggingOut(false);
    }
  };

  const avatarInitial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-[#FBF9F7]">
      {/* ── Top Header ── */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="px-4 pb-3 flex-row items-center justify-between border-b border-[#ECE8E3] bg-[#FBF9F7] z-20"
      >
        {/* Brand Logo "StAle." */}
        <View className="flex-row items-center">
          <Text
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
              fontSize: 26,
              fontWeight: '700',
              color: '#5D1C34',
              letterSpacing: -0.5,
            }}
          >
            St<Text style={{ fontWeight: '900' }}>A</Text>le.
          </Text>
        </View>

        {/* Right Header Icons */}
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            accessibilityLabel="Tìm kiếm"
            onPress={() => (navigation as any).navigate('Search')}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <Search size={22} color="#1B1C1B" />
          </TouchableOpacity>

          <NotificationBell />

          <TouchableOpacity
            accessibilityLabel="Giỏ hàng"
            onPress={() => (navigation as any).navigate('Cart')}
            className="w-10 h-10 items-center justify-center rounded-full relative"
          >
            <ShoppingBag size={22} color="#1B1C1B" />
            {totalCartItems > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: '#C81E51',
                  borderRadius: 9,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#FFFFFF',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Profile Card ── */}
        <View className="bg-white border border-[#ECE8E3] rounded-3xl p-5 shadow-sm mb-4">
          <View className="flex-row items-start">
            {/* Avatar with Active Dot */}
            <View className="relative shrink-0 mr-3.5">
              <View
                style={{ width: 72, height: 72 }}
                className="rounded-2xl bg-[#5D1C34] items-center justify-center overflow-hidden shadow-sm"
              >
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={{ width: 72, height: 72 }}
                    className="rounded-2xl"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-[28px] font-bold text-white">{avatarInitial}</Text>
                )}
              </View>
              {/* Online Green Indicator */}
              <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              </View>
            </View>

            {/* User Info */}
            <View className="flex-1 min-w-0">
              <View className="flex-row items-center gap-2 flex-wrap mb-1">
                <Text
                  className="text-[18px] font-bold text-[#1B1C1B] truncate"
                  numberOfLines={1}
                >
                  {user?.name || 'Người dùng'}
                </Text>
                {tier === 'VIP' ? (
                  <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5D1C34]/10 border border-[#5D1C34]/30">
                    <Crown size={11} color="#5D1C34" />
                    <Text className="text-[11px] font-bold text-[#5D1C34]">VIP</Text>
                  </View>
                ) : tier === 'MEMBER' ? (
                  <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40">
                    <Star size={11} color="#10B981" />
                    <Text className="text-[11px] font-bold text-[#059669]">Member</Text>
                  </View>
                ) : (
                  <View className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]">
                    <Text className="text-[11px] font-medium text-[#6B7280]">Free</Text>
                  </View>
                )}
              </View>

              <Text className="text-[13px] text-[#6B7280] truncate mb-2.5" numberOfLines={1}>
                {user?.email}
              </Text>

              {user?.tierExpiresAt && tier !== 'FREE' && (
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <Clock size={12} color="#5D1C34" />
                  <Text className="text-[11px] text-[#6B7280]">
                    Hạn dùng đến:{' '}
                    <Text className="font-bold text-[#5D1C34]">
                      {new Date(user.tierExpiresAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </Text>
                </View>
              )}

              {/* 3 Pill Action Buttons */}
              <View className="flex-col gap-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Measurements', { tab: 'profile' })}
                  className="self-start flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5D1C34]"
                >
                  <Pencil size={12} color="#FFFFFF" />
                  <Text className="text-[12px] font-semibold text-white">Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate('SubscriptionPlans')}
                  className="self-start flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5D1C34]/15"
                >
                  <Crown size={12} color="#5D1C34" />
                  <Text className="text-[12px] font-bold text-[#5D1C34]">Quản lý gói cước</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('ChangePassword')}
                  className="self-start flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D1D5DB]"
                >
                  <Lock size={12} color="#4B5563" />
                  <Text className="text-[12px] font-medium text-[#374151]">Đổi mật khẩu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Measurements Status Banner */}
          <View
            className={`mt-4 flex-row items-center gap-2.5 p-3 rounded-2xl ${
              hasMeasurement
                ? 'bg-[#ECFDF5] border border-[#A7F3D0]'
                : 'bg-[#FFFBEB] border border-[#FDE68A]'
            }`}
          >
            {hasMeasurement ? (
              <>
                <CheckCircle2 size={16} color="#059669" className="shrink-0" />
                <Text className="text-[12px] font-medium text-[#065F46] flex-1 leading-4">
                  Số đo đã được cập nhật — kết quả thử đồ chính xác hơn
                </Text>
              </>
            ) : (
              <>
                <AlertCircle size={16} color="#D97706" className="shrink-0" />
                <Text className="text-[12px] text-[#92400E] flex-1 leading-4">
                  Chưa có số đo —{' '}
                  <Text
                    onPress={() => navigation.navigate('Measurements')}
                    className="font-bold underline text-[#B45309]"
                  >
                    Thêm ngay
                  </Text>{' '}
                  để sẵn sàng may đo
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ── Quota Overview Card ("Lượt dùng hôm nay") ── */}
        <View className="bg-white border border-[#ECE8E3] rounded-3xl p-4 shadow-sm mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Zap size={16} color="#EAB308" fill="#EAB308" />
              <Text className="text-[15px] font-bold text-[#1B1C1B]">Lượt dùng hôm nay</Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('SubscriptionPlans')}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-[12px] font-bold text-[#5D1C34]">Nâng cấp thêm lượt</Text>
              <ChevronRight size={14} color="#5D1C34" />
            </TouchableOpacity>
          </View>

          <QuotaBar label="Virtual Try-On" quota={tryOnQuota} />
          <QuotaBar label="AI Stylist" quota={stylistQuota} />

          {tier === 'FREE' && (
            <View className="pt-2.5 border-t border-[#F3F4F6] flex-row items-center justify-between flex-wrap">
              <Text className="text-[12px] text-[#6B7280]">
                Gói Free không có lượt Thử đồ AI.{' '}
              </Text>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('SubscriptionPlans')}
              >
                <Text className="text-[12px] font-bold text-[#5D1C34]">
                  Nâng cấp Member (49k) →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Section: TÀI KHOẢN ── */}
        <View className="mb-2">
          <Text className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-wider px-1 mb-2.5">
            TÀI KHOẢN
          </Text>

          <NavCard
            icon={Crown}
            label="Gói cước & Nâng cấp"
            desc="Xem bảng giá và gia hạn gói Member / VIP"
            badge={tier !== 'FREE' ? tier : undefined}
            onPress={() => (navigation as any).navigate('SubscriptionPlans')}
          />

          <NavCard
            icon={Clock}
            label="Lịch sử gói dịch vụ"
            desc="Xem các kỳ đăng ký và giao dịch thanh toán gói"
            onPress={() => (navigation as any).navigate('SubscriptionHistory')}
          />

          <NavCard
            icon={Ruler}
            label="Số đo & Hồ sơ"
            desc="Cập nhật số đo, thông tin cá nhân"
            badge={!hasMeasurement ? 'Mới' : undefined}
            onPress={() => navigation.navigate('Measurements')}
          />

          <NavCard
            icon={MapPin}
            label="Sổ địa chỉ"
            desc="Thêm, sửa và chọn địa chỉ giao hàng mặc định"
            onPress={() => setShowAddressesModal(true)}
          />

          <NavCard
            icon={History}
            label="Lịch sử Try-On"
            desc="Xem lại và tải ảnh thử đồ AI của bạn"
            onPress={() => navigation.navigate('TryOnHistory')}
          />

          <NavCard
            icon={Sparkles}
            label="Lịch sử AI Stylist"
            desc="Các lần tư vấn phong cách đã thực hiện"
            onPress={() => (navigation as any).navigate('StylistHistory')}
          />

          <NavCard
            icon={ShoppingBag}
            label="Đơn hàng của tôi"
            desc="Theo dõi và quản lý đơn hàng"
            onPress={() => navigation.navigate('Orders')}
          />
        </View>

        {/* ── Section: KHÁM PHÁ ── */}
        <View className="mb-4">
          <Text className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-wider px-1 mb-2.5">
            KHÁM PHÁ
          </Text>

          <NavCard
            icon={Camera}
            label="Thử đồ mới"
            desc="Khám phá và thử trang phục công sở"
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'ShopTab',
              } as any)
            }
          />

          <NavCard
            icon={Sparkles}
            label="Tư vấn phong cách"
            desc="AI phân tích và gợi ý outfit phù hợp"
            onPress={() => (navigation as any).navigate('Stylist')}
          />
        </View>

        {/* ── Section: THÔNG TIN & HỖ TRỢ ── */}
        <View className="mb-4">
          <Text className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-wider px-1 mb-2.5">
            THÔNG TIN &amp; HỖ TRỢ
          </Text>

          <NavCard
            icon={ShieldCheck}
            label="Chính sách &amp; Điều khoản"
            desc="Bảo mật, điều khoản sử dụng &amp; chính sách may đo đổi trả"
            onPress={() => (navigation as any).navigate('Policy')}
          />
        </View>

        {/* ── Danger Zone: Logout Button ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowLogoutModal(true)}
          className="w-full py-3.5 bg-[#FAF8F5] border border-[#ECE8E3] rounded-2xl flex-row items-center justify-center gap-2 mb-8 active:bg-[#F3EFEA]"
        >
          <LogOut size={18} color="#6B7280" />
          <Text className="text-[14px] font-semibold text-[#6B7280]">Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Floating AI Chat Button ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => (navigation as any).navigate('Stylist')}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-[#5D1C34] shadow-lg shadow-black/30 items-center justify-center z-30"
      >
        <MessageCircle size={24} color="#FFFFFF" />
        {/* Yellow unread badge */}
        <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F59E0B] border-2 border-white items-center justify-center">
          <Text className="text-[10px] font-bold text-black">1</Text>
        </View>
      </TouchableOpacity>

      {/* ── Addresses Modal ── */}
      <AddressesModal
        visible={showAddressesModal}
        onClose={() => setShowAddressesModal(false)}
      />

      {/* ── Logout Confirmation Modal ── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl items-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-[#FEF2F2] items-center justify-center mb-3">
              <LogOut size={24} color="#DC2626" />
            </View>
            <Text className="text-[17px] font-bold text-[#1B1C1B] mb-1">
              Xác nhận đăng xuất
            </Text>
            <Text className="text-[13px] text-[#6B7280] text-center mb-5">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình?
            </Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 h-11 rounded-xl border border-[#D1D5DB] items-center justify-center"
              >
                <Text className="text-[14px] font-semibold text-[#4B5563]">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 h-11 rounded-xl bg-[#DC2626] items-center justify-center flex-row gap-2"
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-[14px] font-semibold text-white">Đăng xuất</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
