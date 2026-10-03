import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProfileStackParamList } from '@/navigation/types';
import { FeedbackModal } from '@/components/ui/FeedbackModal';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError('');
      await logout();
      setShowLogoutModal(false);
    } catch (err: any) {
      setLogoutError(err.message || 'Không thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderAvatar = () => {
    if (user?.avatarUrl) {
      return (
        <View className="mb-4 h-avatar w-avatar items-center justify-center rounded-full bg-primary-container overflow-hidden">
          <Image
            source={{ uri: user.avatarUrl }}
            className="h-full w-full"
            style={{ width: 80, height: 80 }}
          />
        </View>
      );
    }
    return (
      <View className="mb-4 h-avatar w-avatar items-center justify-center rounded-full bg-primary-container" style={{ width: 80, height: 80 }}>
        <Text className="text-[32px] font-extrabold text-on-primary">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-surface-lowest" contentContainerStyle={{ padding: 16 }}>
        {/* Avatar Card */}
        <View className="mb-6 items-center rounded-xl border border-surface-line bg-white p-6 shadow-sm">
          {renderAvatar()}
          <Text className="text-headline-md font-bold text-on-surface">
            {user?.name || 'Người dùng FashionAI'}
          </Text>
          <Text className="mt-1 text-body-md text-on-surface-variant">{user?.email}</Text>
          <View className="mt-4 rounded-full border border-surface-line bg-surface-low px-4 py-1">
            <Text className="text-label-md font-semibold text-primary">
              Gói thành viên: {user?.tier || 'FREE'}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-headline-sm font-bold text-on-surface">
            Hồ sơ & Cơ thể
          </Text>
          <TouchableOpacity
            className="min-h-11 flex-row items-center justify-between rounded-lg border border-surface-line bg-white p-4 shadow-sm"
            onPress={() => navigation.navigate('Measurements')}
          >
            <Text className="text-body-lg font-semibold text-on-surface">Số đo cơ thể</Text>
            <Text className="text-headline-sm text-on-surface-variant">›</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-headline-sm font-bold text-on-surface">
            Tài khoản & Thiết lập
          </Text>

          <View className="rounded-lg border border-surface-line bg-white p-4 shadow-sm mb-3">
            <View className="flex-row justify-between py-1">
              <Text className="text-body-lg text-on-surface-variant">Vai trò</Text>
              <Text className="text-body-lg font-semibold text-on-surface">
                {user?.role || 'Khách hàng'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="min-h-11 flex-row items-center justify-between rounded-lg border border-surface-line bg-white p-4 shadow-sm"
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text className="text-body-lg font-semibold text-on-surface">Đổi mật khẩu</Text>
            <Text className="text-headline-sm text-on-surface-variant">›</Text>
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất */}
        <TouchableOpacity
          className="mt-4 min-h-11 items-center rounded-xl border border-danger bg-danger/10 py-3"
          onPress={() => {
            setLogoutError('');
            setShowLogoutModal(true);
          }}
        >
          <Text className="text-body-lg font-bold text-danger">Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <FeedbackModal
        visible={showLogoutModal}
        onClose={() => {
          if (!isLoggingOut) {
            setShowLogoutModal(false);
            setLogoutError('');
          }
        }}
        type="warning"
        customIcon={
          <Ionicons name="log-out-outline" size={32} className="text-danger" />
        }
        iconBgClassName="bg-danger/10"
        title="Đăng xuất"
        message={
          logoutError || 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?'
        }
        primaryButtonText="Xác nhận"
        primaryButtonVariant="primary"
        primaryButtonLoading={isLoggingOut}
        onPrimaryPress={confirmLogout}
        secondaryButtonText="Hủy"
        onSecondaryPress={() => {
          setShowLogoutModal(false);
          setLogoutError('');
        }}
        secondaryButtonDisabled={isLoggingOut}
      />
    </>
  );
};
