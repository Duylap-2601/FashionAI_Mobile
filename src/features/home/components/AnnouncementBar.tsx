import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';

interface AnnouncementBarProps {
  onPressTryOn?: () => void;
  onPressShop?: () => void;
}

// FE MESSAGES (FashionAI_FE/src/features/home/constants/announcement-bar.ts), kept
// honest for the app: shipping is quoted by GHN at checkout (no free-shipping
// threshold exists in the backend) and no collection launch is claimed.
const ANNOUNCEMENT_MESSAGES = [
  { text: 'StAie. Chuẩn dáng từ đầu, đẹp từng đường may', target: 'shop' },
  // Gói Miễn phí không có lượt thử đồ (AI_ACTION_LIMITS.TRY_ON.FREE = 0), nên không ghi "miễn phí".
  { text: 'Thử đồ AI, xem kết quả trước khi đặt may', target: 'try-on' },
  { text: 'May đo theo số đo riêng của bạn', target: 'shop' },
  { text: 'Khám phá bộ sưu tập công sở của StAie.', target: 'shop' },
];

export function AnnouncementBar({ onPressTryOn, onPressShop }: AnnouncementBarProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const reduceMotion = useReducedMotion();

  // Rotates every 5s like FE; off under the system reduce-motion setting.
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + ANNOUNCEMENT_MESSAGES.length) % ANNOUNCEMENT_MESSAGES.length);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
  };

  const current = ANNOUNCEMENT_MESSAGES[currentIdx];

  const handlePress = () => {
    if (current.target === 'try-on') {
      onPressTryOn?.();
    } else {
      onPressShop?.();
    }
  };

  return (
    <View className="z-50 h-10 w-full flex-row items-center justify-between border-b border-landing-paper/10 bg-landing-obsidian px-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thông báo trước"
        onPress={handlePrev}
        // 40px bar; the slop lifts the target to 44px.
        hitSlop={2}
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <ChevronLeft size={14} color={COLORS.paper} opacity={0.45} />
      </Pressable>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={current.text}
        onPress={handlePress}
        className="mx-2 h-10 flex-1 flex-row items-center justify-center gap-2.5 active:opacity-80"
      >
        <View className="h-1 w-1 rounded-full bg-landing-brass" />
        <Text
          accessibilityLiveRegion="polite"
          numberOfLines={1}
          className="shrink text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-landing-paper/80"
        >
          {current.text}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thông báo tiếp theo"
        onPress={handleNext}
        hitSlop={2}
        className="h-10 w-10 items-center justify-center active:opacity-60"
      >
        <ChevronRight size={14} color={COLORS.paper} opacity={0.45} />
      </Pressable>
    </View>
  );
}
