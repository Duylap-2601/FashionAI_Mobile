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
    <ScrollView className="flex-1 bg-surface-lowest" contentContainerStyle={{ padding: 16 }}>
      {/* Avatar Card */}
      <View className="mb-6 items-center rounded-xl border border-surface-line bg-white p-6 shadow-sm">
        <View className="mb-4 h-avatar w-avatar items-center justify-center rounded-full bg-primary-container">
          <Text className="text-[32px] font-extrabold text-on-primary">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
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

      {/* Nút Đăng xuất có style chuẩn NativeWind tokens */}
      <TouchableOpacity
        className="mt-4 min-h-11 items-center rounded-xl border border-danger bg-danger/10 py-3"
        onPress={handleLogout}
      >
        <Text className="text-body-lg font-bold text-danger">Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
