import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth.api';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user } = useAuth();
  const [quota, setQuota] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuota = async () => {
    try {
      const data = await authApi.getUserQuota();
      setQuota(data);
    } catch (err) {
      console.warn('Failed to load quota:', err);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuota();
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row items-center justify-between bg-surface-lowest px-xl pt-xxl pb-lg">
        <View>
          <Text className="text-body-sm text-on-surface-variant">Xin chào,</Text>
          <Text className="text-xxl font-bold text-on-surface">
            {user?.name || user?.email || 'Người dùng'}
          </Text>
        </View>
        <View className="rounded-full bg-primary-container px-md py-xs">
          <Text className="text-body-sm font-bold tracking-wide text-on-primary">
            {user?.tier || 'FREE'}
          </Text>
        </View>
      </View>

      {/* Quota Card */}
      <View className="m-xl rounded-xl border border-surface-line bg-surface-lowest p-xl shadow-sm">
        <Text className="text-body-lg font-bold text-on-surface">Hạn mức AI hôm nay</Text>
        <Text className="mt-1 text-body-sm text-on-surface-variant">
          Virtual Try-On & AI Stylist được cấp theo gói dịch vụ của bạn.
        </Text>
        {quota ? (
          <View className="mt-lg flex-row border-t border-surface-line pt-lg">
            <View className="flex-1 items-center">
              <Text className="text-xxl font-extrabold text-primary-container">
                {quota.remaining ?? '-'}
              </Text>
              <Text className="mt-0.5 text-body-sm text-on-surface-variant">Lượt còn lại</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xxl font-extrabold text-primary-container">
                {quota.limit ?? '-'}
              </Text>
              <Text className="mt-0.5 text-body-sm text-on-surface-variant">Tổng hạn mức</Text>
            </View>
          </View>
        ) : (
          <Text className="mt-md text-body-sm italic text-outline">
            Đang cập nhật hạn mức...
          </Text>
        )}
      </View>

      {/* Quick Action Grid */}
      <Text className="mx-xl mt-sm mb-md text-headline-sm text-on-surface">
        Tính năng nổi bật
      </Text>
      <View className="flex-row gap-md px-xl">
        <TouchableOpacity
          className="min-h-11 flex-1 rounded-xl border border-surface-line bg-surface-lowest p-lg"
          onPress={() => navigation.navigate('TryOnTab')}
          activeOpacity={0.7}
        >
          <Text className="mb-sm text-icon-lg">👗</Text>
          <Text className="mb-1 text-body-lg font-bold text-on-surface">Virtual Try-On</Text>
          <Text className="text-body-sm leading-4 text-on-surface-variant">
            Thử trang phục với ảnh người thật bằng AI
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
