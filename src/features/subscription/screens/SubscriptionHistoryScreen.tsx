import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Clock,
  Crown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Sparkles,
} from 'lucide-react-native';
import { useSubscriptionHistory, useMySubscription } from '../hooks/use-subscription';
import { formatCurrency } from '@/utils/format';
import { COLORS } from '@/constants/theme';

function renderStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'PAID':
    case 'COMPLETED':
      return (
        <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <CheckCircle2 size={11} color="#059669" />
          <Text className="text-[11px] font-bold text-emerald-700">Đang hoạt động</Text>
        </View>
      );
    case 'EXPIRED':
      return (
        <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-line border border-surface-line">
          <Clock size={11} color="#737373" />
          <Text className="text-[11px] font-medium text-on-surface-variant">Đã hết hạn</Text>
        </View>
      );
    case 'CANCELLED':
      return (
        <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
          <XCircle size={11} color="#DC2626" />
          <Text className="text-[11px] font-medium text-red-700">Đã hủy</Text>
        </View>
      );
    case 'PENDING':
      return (
        <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
          <Clock size={11} color="#D97706" />
          <Text className="text-[11px] font-medium text-amber-700">Chờ xử lý</Text>
        </View>
      );
    default:
      return (
        <View className="px-2.5 py-0.5 rounded-full bg-surface-line">
          <Text className="text-[11px] font-medium text-on-surface-variant">{status}</Text>
        </View>
      );
  }
}

export function SubscriptionHistoryScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    history,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useSubscriptionHistory(1, 50);

  const { subscription } = useMySubscription();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-lowest">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-line bg-surface">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 -ml-1 rounded-full items-center justify-center active:bg-surface-line"
          accessibilityLabel="Quay lại"
        >
          <ArrowLeft size={20} color="#1A1A1A" />
        </Pressable>
        <Text className="flex-1 text-center font-bold text-headline-sm text-on-surface pr-9">
          Lịch sử gói dịch vụ
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={['#5D1C34']}
            tintColor="#5D1C34"
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current status banner */}
        <View className="bg-surface border border-surface-line rounded-2xl p-4 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                Gói hiện tại
              </Text>
              <Text className="text-xl font-bold text-primary mt-0.5">
                {subscription?.tier || 'FREE'}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('SubscriptionPlans')}
              className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 flex-row items-center gap-1.5 active:opacity-75"
            >
              <Crown size={14} color="#5D1C34" />
              <Text className="text-[12px] font-bold text-primary">Nâng cấp gói</Text>
            </Pressable>
          </View>
        </View>

        {/* List Header */}
        <Text className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3 px-1">
          Lịch sử giao dịch ({history?.length || 0})
        </Text>

        {isLoadingHistory ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#5D1C34" />
            <Text className="mt-3 text-body-sm text-on-surface-variant">
              Đang tải lịch sử đăng ký...
            </Text>
          </View>
        ) : !history || history.length === 0 ? (
          <View className="bg-surface border border-surface-line rounded-2xl p-8 items-center justify-center">
            <Clock size={40} color="#9CA3AF" />
            <Text className="text-body-lg font-bold text-on-surface mt-3">
              Chưa có lịch sử đăng ký
            </Text>
            <Text className="text-body-sm text-on-surface-variant text-center mt-1 max-w-[280px]">
              Các chu kỳ đăng ký gói Member hoặc VIP của bạn sẽ được lưu trữ và hiển thị tại đây.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('SubscriptionPlans')}
              className="mt-5 px-5 py-2.5 rounded-xl bg-primary"
            >
              <Text className="text-white font-bold text-label-md">Xem các gói tài khoản</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {history.map((item: any) => {
              const startDate = item.startDate || item.createdAt;
              const endDate = item.endDate || item.expiresAt;

              return (
                <View
                  key={item.id}
                  className="bg-surface border border-surface-line rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
                        <Crown size={16} color="#5D1C34" />
                      </View>
                      <View>
                        <Text className="text-body-md font-bold text-on-surface">
                          Gói {item.tier}
                        </Text>
                        <Text className="text-[11px] text-on-surface-variant">
                          Mã: #{String(item.id).substring(0, 8)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-body-md font-bold text-primary">
                        {formatCurrency(
                          item.amount || (item.tier === 'MEMBER' ? 34000 : 99000)
                        )}
                      </Text>
                      {renderStatusBadge(item.status)}
                    </View>
                  </View>

                  <View className="pt-2.5 border-t border-surface-line/60 gap-1 text-body-sm">
                    <View className="flex-row justify-between">
                      <Text className="text-[12px] text-on-surface-variant">Cổng thanh toán:</Text>
                      <Text className="text-[12px] font-medium text-on-surface">
                        {item.provider || 'SEPAY'}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-[12px] text-on-surface-variant">Ngày thanh toán:</Text>
                      <Text className="text-[12px] font-medium text-on-surface">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
                      </Text>
                    </View>

                    {endDate && (
                      <View className="flex-row justify-between">
                        <Text className="text-[12px] text-on-surface-variant">Chu kỳ đến:</Text>
                        <Text className="text-[12px] font-medium text-on-surface">
                          {new Date(endDate).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
