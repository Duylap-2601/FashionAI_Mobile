import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ruler, ArrowRight, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';

const ONBOARDING_STORAGE_KEY = '@fashionai_onboarding_completed';

// Chỉ nêu những gì tài khoản thật sự có, như danh sách quyền lợi của FE AuthSplitLayout.
const FEATURES = [
  { title: 'Thử đồ AI', description: 'Thử trang phục trên ảnh của bạn.' },
  { title: 'May đo riêng', description: 'Cắt may theo số đo cơ thể bạn lưu trong hồ sơ.' },
  { title: 'AI Stylist', description: 'Gợi ý phối đồ theo dịp và phong cách.' },
] as const;

interface OnboardingModalProps {
  forceVisible?: boolean;
  onDismiss?: () => void;
}

export function OnboardingModal({ forceVisible, onDismiss }: OnboardingModalProps) {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(!!forceVisible);

  // Mở lại khi `forceVisible` bật lên, bằng mẫu "điều chỉnh state theo props" của React
  // thay vì gọi setState đồng bộ trong effect.
  const [prevForceVisible, setPrevForceVisible] = useState(forceVisible);
  if (prevForceVisible !== forceVisible) {
    setPrevForceVisible(forceVisible);
    if (forceVisible) setVisible(true);
  }

  useEffect(() => {
    if (forceVisible) return;

    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then((value) => {
      if (!value) {
        setVisible(true);
      }
    });
  }, [forceVisible]);

  const handleClose = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setVisible(false);
    onDismiss?.();
  };

  const handleAddMeasurements = async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setVisible(false);
    onDismiss?.();
    navigation.navigate('Main', {
      screen: 'ProfileTab',
      params: { screen: 'Measurements', params: { tab: 'measurements' } },
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 items-center justify-center bg-landing-obsidian/45 p-5">
        <View
          accessibilityViewIsModal
          className="relative w-full max-w-[360px] items-center rounded-subtle border border-landing-line bg-landing-paper p-6"
        >
          <Pressable
            onPress={handleClose}
            className="absolute right-2 top-2 h-11 w-11 items-center justify-center active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          >
            <X size={18} strokeWidth={1.75} color={COLORS.muted} />
          </Pressable>

          <View className="mb-4 mt-2 h-16 w-16 items-center justify-center rounded-subtle border border-landing-line bg-landing-ivory">
            <Ruler size={28} strokeWidth={1.5} color={COLORS.brassInk} />
          </View>

          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-brass-ink">
            Tài khoản mới
          </Text>
          <Text
            accessibilityRole="header"
            className="mb-2 mt-2 px-2 text-center font-display text-[24px] leading-tight text-landing-obsidian"
          >
            Chào mừng đến StAie.
          </Text>

          <Text className="mb-5 px-1 text-center font-sans text-body-md leading-relaxed text-landing-muted">
            Thêm số đo cơ thể để Thử đồ AI cho kết quả sát với dáng người của bạn hơn.
          </Text>

          {/* Danh sách đánh số mono, ngăn bằng hairline, như ACCOUNT_BENEFITS của FE. */}
          <View className="mb-6 w-full border-t border-landing-line">
            {FEATURES.map((feature, index) => (
              <View
                key={feature.title}
                className="flex-row gap-md border-b border-landing-line py-md"
              >
                <Text className="pt-0.5 font-mono text-[12px] tracking-[0.2em] text-brass-ink">
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <View className="flex-1 gap-0.5">
                  <Text className="font-sans text-body-md font-semibold text-landing-obsidian">
                    {feature.title}
                  </Text>
                  <Text className="font-sans text-body-sm text-landing-muted">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="w-full gap-sm">
            <Button
              title="Thêm số đo ngay"
              size="lg"
              onPress={handleAddMeasurements}
              rightIcon={<ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />}
            />
            <Button
              title="Bỏ qua, tôi sẽ thêm sau"
              variant="outline"
              onPress={handleClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
