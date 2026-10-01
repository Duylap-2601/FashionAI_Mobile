import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ProfileStackParamList } from '@/navigation/types';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể đăng xuất');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-xl">
      <View className="mb-xl items-center rounded-xl border border-surface-line bg-surface-lowest p-xxl shadow-sm">
        <View className="mb-md h-avatar w-avatar items-center justify-center rounded-full bg-primary-container">
          <Text className="text-xxl font-extrabold text-on-primary">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
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
        className="mt-md min-h-11 items-center rounded-lg border border-danger-soft-strong bg-danger-soft py-lg"
        onPress={handleLogout}
      >
        <Text className="text-body-lg font-bold text-danger">Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
