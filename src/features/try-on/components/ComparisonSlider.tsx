import React, { useState, useRef } from 'react';
import { View, Text, PanResponder, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, SlidersHorizontal, Eye } from 'lucide-react-native';

interface ComparisonSliderProps {
  before?: string | null;
  after: string;
}

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

  const panResponder = useRef(
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
  ).current;

  // Nếu không có ảnh gốc, hiển thị ảnh kết quả bình thường
  if (!before) {
    return (
      <View className="overflow-hidden rounded-2xl border border-surface-line bg-surface-lowest shadow-sm">
        <Image
          source={{ uri: after }}
          style={{ aspectRatio: 3 / 4 }}
          className="w-full"
          contentFit="cover"
          transition={300}
        />
      </View>
    );
  }

  const sliderX = (containerWidth * position) / 100;

  return (
    <View className="gap-3">
      {/* Container so sánh */}
      <View
        ref={containerRef}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
        className="w-full aspect-[3/4] relative overflow-hidden rounded-2xl border border-surface-line bg-surface-lowest shadow-sm"
      >
        {/* Ảnh sau (Kết quả thử đồ) */}
        <Image
          source={{ uri: after }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        {/* Lớp phủ ảnh trước (Ảnh gốc) */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: sliderX,
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: before }}
            style={{ width: containerWidth, height: '100%' }}
            contentFit="cover"
          />
        </View>

        {/* Thanh trượt phân cách */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: sliderX - 1.5,
            width: 3,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 3,
            elevation: 5,
          }}
        >
          {/* Nút cầm trượt */}
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: -18,
              marginTop: -20,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#E5DFD5',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center gap-1">
              <View className="w-1 h-3.5 rounded-full bg-primary/70" />
              <View className="w-1 h-3.5 rounded-full bg-primary/70" />
            </View>
          </View>
        </View>

        {/* Badges góc trên */}
        <View className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 rounded-full">
          <Text className="text-white text-[11px] font-semibold tracking-wide">Ảnh gốc</Text>
        </View>
        <View className="absolute top-3 right-3 px-2.5 py-1 bg-primary/80 rounded-full">
          <Text className="text-white text-[11px] font-semibold tracking-wide">Kết quả AI</Text>
        </View>

        {/* Gợi ý kéo ngón tay */}
        <View className="absolute bottom-3 self-center px-3 py-1 bg-black/45 rounded-full">
          <Text className="text-white/90 text-[11px] font-medium">Kéo thanh trượt để so sánh</Text>
        </View>
      </View>

      {/* Preset Buttons */}
      <View className="flex-row items-center justify-center gap-2">
        <Pressable
          onPress={() => setPosition(100)}
          className={`px-3 py-1.5 rounded-xl border active:opacity-75 ${
            position === 100 ? 'bg-primary border-primary' : 'bg-surface border-surface-line'
          }`}
        >
          <Text className={`text-[12px] font-semibold ${position === 100 ? 'text-white' : 'text-on-surface'}`}>
            Xem ảnh gốc
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPosition(50)}
          className={`px-3 py-1.5 rounded-xl border active:opacity-75 ${
            position === 50 ? 'bg-primary border-primary' : 'bg-surface border-surface-line'
          }`}
        >
          <Text className={`text-[12px] font-semibold ${position === 50 ? 'text-white' : 'text-on-surface'}`}>
            So sánh 50/50
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPosition(0)}
          className={`px-3 py-1.5 rounded-xl border active:opacity-75 ${
            position === 0 ? 'bg-primary border-primary' : 'bg-surface border-surface-line'
          }`}
        >
          <Text className={`text-[12px] font-semibold ${position === 0 ? 'text-white' : 'text-on-surface'}`}>
            Xem kết quả
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
