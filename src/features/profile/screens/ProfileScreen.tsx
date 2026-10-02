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
        <Image
          source={{ uri: user.avatarUrl }}
          className="h-avatar w-avatar rounded-full"
          style={{ width: 80, height: 80 }}
        />
      );
    }
    return (
      <View className="h-avatar w-avatar items-center justify-center rounded-full bg-primary-container">
        <Text className="text-xxl font-extrabold text-on-primary">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-xl">
        <View className="mb-xl items-center rounded-xl border border-surface-line bg-surface-lowest p-xxl shadow-sm">
          {renderAvatar()}
          <Text className="text-xl font-bold text-on-surface">
            {user?.name || 'Người dùng FashionAI'}
          </Text>
          <Text className="mt-1 text-body-sm text-on-surface-variant">{user?.email}</Text>
          <View className="mt-md rounded-full border border-surface-line bg-surface-low px-md py-xs">
            <Text className="text-body-sm font-semibold text-primary-container">
              Gói thành viên: {user?.tier || 'FREE'}
            </Text>
          </View>
        </View>

        <View className="mb-xl">
          <Text className="mb-sm text-body-lg font-bold text-on-surface">
            Tài khoản & Thiết lập
          </Text>

          <View className="rounded-lg border border-surface-line bg-surface-lowest p-lg shadow-sm">
            <View className="flex-row justify-between py-xs">
              <Text className="text-body-sm text-on-surface-variant">Vai trò</Text>
              <Text className="text-body-sm font-semibold text-on-surface">
                {user?.role || 'Khách hàng'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="mt-md min-h-11 flex-row items-center justify-between rounded-lg border border-surface-line bg-surface-lowest p-lg shadow-sm"
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text className="text-body-sm font-semibold text-on-surface">Đổi mật khẩu</Text>
            <Text className="text-headline-sm text-on-surface-variant">›</Text>
          </TouchableOpacity>
        </View>

<TouchableOpacity
          className="mt-md min-h-11 items-center rounded-lg border border-primary-container bg-primary-container py-lg"
          onPress={() => {
            setLogoutError('');
            setShowLogoutModal(true);
          }}
        >
          <Text className="text-body-lg font-bold text-primary-foreground">Đăng xuất</Text>
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
          <Ionicons name="log-out-outline" size={32} className="text-primary-foreground" />
        }
        iconBgClassName="bg-primary-soft"
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
