import React, { useState, useRef } from 'react';
import { View, Text, PanResponder, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import { Image } from 'expo-image';

interface ComparisonSliderProps {
  before?: string | null;
  after: string;
}

const PRESETS: { position: number; label: string }[] = [
  { position: 100, label: 'Ảnh gốc' },
  { position: 50, label: 'So sánh 50/50' },
  { position: 0, label: 'Kết quả' },
];

// expo-image không nhận className nên khung ảnh nằm ở style.
const SINGLE_IMAGE_STYLE = { width: '100%', aspectRatio: 3 / 4 } as const;
const BADGE_TEXT_CLASS =
  'font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-landing-paper';

export function ComparisonSlider({ before, after }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50); // percentage 0 - 100
  const [containerWidth, setContainerWidth] = useState(300);
  const containerRef = useRef<View>(null);
  const containerPageX = useRef(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
    if (containerRef.current) {
      containerRef.current.measure((_x, _y, _width, _height, pageX) => {
        containerPageX.current = pageX;
      });
    }
  };

  const updatePositionFromPageX = (pageX: number) => {
    if (containerWidth <= 0) return;
    const relativeX = pageX - containerPageX.current;
    const pct = Math.max(0, Math.min(100, (relativeX / containerWidth) * 100));
    setPosition(pct);
  };

  // Tạo một lần ở lần render đầu (như useRef trước đây); useState lazy init để không đọc ref khi render.
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (containerRef.current) {
          containerRef.current.measure((_x, _y, _width, _height, pageX) => {
            containerPageX.current = pageX;
            updatePositionFromPageX(evt.nativeEvent.pageX);
          });
        }
      },
      onPanResponderMove: (evt) => {
        updatePositionFromPageX(evt.nativeEvent.pageX);
      },
    })
  );

  // Nếu không có ảnh gốc, hiển thị ảnh kết quả bình thường
  if (!before) {
    return (
      <View className="overflow-hidden border border-landing-line bg-ivory">
        <Image
          source={{ uri: after }}
          style={SINGLE_IMAGE_STYLE}
          contentFit="contain"
          transition={300}
          accessibilityLabel="Kết quả thử trang phục"
        />
      </View>
    );
  }

  const sliderX = (containerWidth * position) / 100;

  return (
    <View className="gap-3">
      {/* Khung so sánh: kéo ngang để đổi tỉ lệ ảnh gốc / kết quả (FE ComparisonSlider). */}
      <View
        ref={containerRef}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
        accessible
        accessibilityLabel="So sánh ảnh gốc và kết quả thử đồ"
        accessibilityHint="Kéo ngang để so sánh, hoặc dùng các nút bên dưới"
        className="relative aspect-[3/4] w-full overflow-hidden border border-landing-line bg-ivory"
      >
        {/* Ảnh sau (Kết quả thử đồ) */}
        <Image source={{ uri: after }} style={StyleSheet.absoluteFill} contentFit="contain" />

        {/* Lớp phủ ảnh trước (Ảnh gốc); bề rộng tính theo vị trí thanh trượt. */}
        <View className="absolute bottom-0 left-0 top-0 overflow-hidden bg-ivory" style={{ width: sliderX }}>
          <Image
            source={{ uri: before }}
            style={{ width: containerWidth, height: '100%' }}
            contentFit="contain"
          />
        </View>

        {/* Thanh phân cách 1px giấy và nút cầm vuông, vị trí tính theo sliderX. */}
        <View
          pointerEvents="none"
          className="absolute bottom-0 top-0 w-9 items-center"
          style={{ left: sliderX - 18 }}
        >
          <View className="h-full w-px bg-landing-paper" />
          <View className="absolute left-0 top-1/2 -mt-[18px] h-9 w-9 flex-row items-center justify-center gap-1 border border-landing-line bg-landing-paper">
            <View className="h-3.5 w-px bg-landing-obsidian/50" />
            <View className="h-3.5 w-px bg-landing-obsidian/50" />
          </View>
        </View>

        <View pointerEvents="none" className="absolute left-3 top-3 bg-landing-obsidian/80 px-2 py-1">
          <Text className={BADGE_TEXT_CLASS}>Trước</Text>
        </View>
        <View pointerEvents="none" className="absolute right-3 top-3 bg-oxblood px-2 py-1">
          <Text className={BADGE_TEXT_CLASS}>Sau</Text>
        </View>
      </View>

      {/* Nút đặt nhanh: Ảnh gốc / So sánh 50/50 / Kết quả */}
      <View accessibilityRole="radiogroup" className="flex-row border border-landing-line">
        {PRESETS.map((preset) => {
          const selected = position === preset.position;
          return (
            <Pressable
              key={preset.position}
              accessibilityRole="radio"
              accessibilityLabel={preset.label}
              accessibilityState={{ checked: selected }}
              onPress={() => setPosition(preset.position)}
              className={`h-11 flex-1 items-center justify-center px-2 active:opacity-80 ${
                selected ? 'bg-oxblood' : ''
              }`}
            >
              <Text
                numberOfLines={1}
                className={`font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
                  selected ? 'text-landing-paper' : 'text-landing-obsidian/70'
                }`}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
