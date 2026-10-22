import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface AnnouncementBarProps {
  onPressTryOn?: () => void;
  onPressShop?: () => void;
}

const ANNOUNCEMENT_MESSAGES = [
  { text: '✨ StAle. — CHUẨN DÁNG TỪ ĐẦU, ĐẸP TỪNG ĐƯỜNG MAY', target: 'shop' },
  { text: '🌟 TRẢI NGHIỆM THỬ ĐỒ ẢO AI MIỄN PHÍ — THẤY KẾT QUẢ TRƯỚC KHI MUA', target: 'try-on' },
  { text: '🚚 FREESHIP TOÀN QUỐC CHO MỌI ĐƠN HÀNG TỪ 500.000₫', target: 'shop' },
  { text: '👔 BỘ SƯU TẬP MỚI 2026 ĐÃ CHÍNH THỨC RA MẮT — XEM NGAY', target: 'shop' },
];

export function AnnouncementBar({ onPressTryOn, onPressShop }: AnnouncementBarProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 4500);
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
    <View className="w-full bg-[#15434e] h-10 flex-row items-center justify-between px-3 border-b border-[#1b505c]">
      <Pressable
        onPress={handlePrev}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="w-7 h-7 items-center justify-center rounded-full active:bg-white/10"
        accessibilityLabel="Thông báo trước"
      >
        <ChevronLeft size={16} color="rgba(255, 255, 255, 0.75)" />
      </Pressable>

      <Pressable
        onPress={handlePress}
        className="flex-1 mx-2 items-center justify-center active:opacity-80"
      >
        <Text
          numberOfLines={1}
          className="text-white text-[11px] font-semibold tracking-wider text-center"
        >
          {current.text}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleNext}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="w-7 h-7 items-center justify-center rounded-full active:bg-white/10"
        accessibilityLabel="Thông báo tiếp theo"
      >
        <ChevronRight size={16} color="rgba(255, 255, 255, 0.75)" />
      </Pressable>
    </View>
  );
}
