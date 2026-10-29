import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface AnnouncementBarProps {
  onPressTryOn?: () => void;
  onPressShop?: () => void;
}

const ANNOUNCEMENT_MESSAGES = [
  { text: 'StAie. Chuẩn dáng từ đầu, đẹp từng đường may', target: 'shop' },
  { text: 'Thử đồ AI miễn phí, xem kết quả trước khi mua', target: 'try-on' },
  { text: 'Freeship toàn quốc cho đơn hàng từ 500.000₫', target: 'shop' },
  { text: 'Bộ sưu tập mới 2026 đã chính thức ra mắt', target: 'shop' },
];

export function AnnouncementBar({ onPressTryOn, onPressShop }: AnnouncementBarProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    <View
      accessibilityRole="header"
      className="z-50 h-10 w-full flex-row items-center justify-between border-b border-landing-paper/10 bg-landing-obsidian px-2"
    >
      <Pressable
        onPress={handlePrev}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="h-8 w-8 items-center justify-center rounded-full active:bg-landing-paper/10"
        accessibilityLabel="Thông báo trước"
      >
        <ChevronLeft size={14} color="rgba(239, 233, 225, 0.45)" />
      </Pressable>

      <Pressable
        onPress={handlePress}
        className="mx-2 flex-1 flex-row items-center justify-center active:opacity-80"
      >
        <View className="mr-2 h-1.5 w-1.5 rounded-full bg-landing-brass" />
        <Text
          numberOfLines={1}
          className="text-center font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-paper/85"
        >
          {current.text}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleNext}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="h-8 w-8 items-center justify-center rounded-full active:bg-landing-paper/10"
        accessibilityLabel="Thông báo tiếp theo"
      >
        <ChevronRight size={14} color="rgba(239, 233, 225, 0.45)" />
      </Pressable>
    </View>
  );
}
