import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Sparkles, Ruler, Shirt, ArrowRight, X } from 'lucide-react-native';

const ONBOARDING_STORAGE_KEY = '@fashionai_onboarding_completed';

interface OnboardingModalProps {
  forceVisible?: boolean;
  onDismiss?: () => void;
}

export function OnboardingModal({ forceVisible, onDismiss }: OnboardingModalProps) {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      return;
    }

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
      <View className="flex-1 bg-black/65 items-center justify-center p-5">
        <View className="bg-surface rounded-3xl p-6 w-full max-w-[360px] items-center border border-surface-line shadow-2xl relative">
          {/* Close button */}
          <Pressable
            onPress={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center active:bg-surface-line"
            accessibilityLabel="Đóng modal"
          >
            <X size={18} color="#737373" />
          </Pressable>

          {/* Logo Badge */}
          <View className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mb-4 mt-2">
            <Sparkles size={32} color="#5D1C34" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-on-surface text-center mb-2">
            Chào mừng đến FashionAI!
          </Text>

          <Text className="text-body-sm text-on-surface-variant text-center leading-relaxed mb-5 px-1">
            Nền tảng thời trang may đo công sở kết hợp trí tuệ nhân tạo. Hãy sẵn sàng trải nghiệm:
          </Text>

          {/* Features preview list */}
          <View className="w-full gap-3 mb-6 bg-surface-lowest p-3.5 rounded-2xl border border-surface-line">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                <Shirt size={16} color="#5D1C34" />
              </View>
              <View className="flex-1">
                <Text className="text-body-sm font-bold text-on-surface">Phòng thử đồ ảo (Try-On)</Text>
                <Text className="text-[11px] text-on-surface-variant">Thử trang phục trên ảnh của bạn</Text>
              </View>
            </View>

            <View className="h-px bg-surface-line/70" />

            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                <Ruler size={16} color="#5D1C34" />
              </View>
              <View className="flex-1">
                <Text className="text-body-sm font-bold text-on-surface">May đo chuẩn thông số</Text>
                <Text className="text-[11px] text-on-surface-variant">Cắt may riêng vừa vặn theo vóc dáng</Text>
              </View>
            </View>

            <View className="h-px bg-surface-line/70" />

            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                <Sparkles size={16} color="#5D1C34" />
              </View>
              <View className="flex-1">
                <Text className="text-body-sm font-bold text-on-surface">AI Stylist cá nhân</Text>
                <Text className="text-[11px] text-on-surface-variant">Gợi ý bảng màu và phối outfit</Text>
              </View>
            </View>
          </View>

          {/* Action CTAs */}
          <View className="w-full gap-2.5">
            <Pressable
              onPress={handleAddMeasurements}
              className="w-full min-h-[48px] rounded-xl bg-primary flex-row items-center justify-center gap-2 active:opacity-90 shadow-sm"
              accessibilityRole="button"
            >
              <Ruler size={16} color="#FFFFFF" />
              <Text className="text-white font-bold text-label-lg">Cập nhật số đo ngay</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={handleClose}
              className="w-full min-h-[44px] rounded-xl border border-surface-line items-center justify-center active:bg-surface-line/50"
              accessibilityRole="button"
            >
              <Text className="text-on-surface-variant font-medium text-body-sm">Để tôi khám phá sau</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
