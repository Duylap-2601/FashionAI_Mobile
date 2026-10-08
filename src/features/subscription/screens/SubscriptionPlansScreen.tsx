import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Placeholder owned by Dev 3 (Commerce & Account Lead) — see MOBILE_TASK_ALLOCATION.md
// Sprint 3 "Mua/nâng cấp Gói VIP Subscription". This stub exists only so the
// 'SubscriptionPlans' route compiles and the quota-exceeded navigation from
// Virtual/Live Try-On has somewhere real to go. Dev 3 replaces this file's
// contents in place; the route name and RootStackParamList entry stay fixed.
export const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 justify-center bg-background p-xl">
      <Card className="items-center p-xxl">
        <Text className="mb-sm text-headline-md font-bold text-on-surface">
          Các gói hội viên
        </Text>
        <Text className="mb-lg text-center text-body-md text-on-surface-variant">
          Màn hình gói VIP đang được chuẩn bị. Quay lại sau để nâng cấp hạn mức AI Try-On.
        </Text>
        <Button title="Quay lại" variant="outline" onPress={() => navigation.goBack()} />
      </Card>
    </View>
  );
};

export default SubscriptionPlansScreen;
