import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import { useSubscriptionHistory, useMySubscription } from '../hooks/use-subscription';
import { SubscriptionHistoryList } from '../components/SubscriptionHistoryList';
import { SUBSCRIPTION_TIER_LABELS } from '../constants/plans';

const ACTION_LABEL_CLASS = 'font-sans text-[11px] font-semibold uppercase tracking-[0.16em]';

export function SubscriptionHistoryScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    history,
    meta,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useSubscriptionHistory(1, 50);

  const { subscription } = useMySubscription();
  const tier = (subscription?.tier || 'FREE').toUpperCase();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchHistory();
    setRefreshing(false);
  };

  const openPlans = () => navigation.navigate('SubscriptionPlans');

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-lg pb-giant pt-lg"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[COLORS.oxblood]}
            tintColor={COLORS.oxblood}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <BackButton label="Quay lại" onPress={() => navigation.goBack()} />

        <View className="gap-2 border-b border-landing-line pb-5">
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
            Gói thành viên
          </Text>
          <Text
            accessibilityRole="header"
            className="font-display text-[30px] leading-tight text-landing-obsidian"
          >
            Lịch sử thanh toán
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Các lần mua và gia hạn gói trả phí, mới nhất trước.
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-4 border-l-2 border-landing-brass bg-landing-ivory px-4 py-4">
          <View className="flex-1 gap-1">
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
              Gói hiện tại
            </Text>
            <Text className="font-display text-[24px] leading-tight text-landing-obsidian">
              {SUBSCRIPTION_TIER_LABELS[tier] ?? tier}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem các gói"
            onPress={openPlans}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line px-4 active:opacity-70"
          >
            <Text className={`${ACTION_LABEL_CLASS} text-landing-obsidian`}>Xem các gói</Text>
          </Pressable>
        </View>

        <SubscriptionHistoryList
          history={history}
          isLoading={isLoadingHistory}
          total={meta.total}
          onBrowsePlans={openPlans}
        />
      </ScrollView>
    </View>
  );
}
