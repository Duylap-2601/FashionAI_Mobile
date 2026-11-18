import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/common/Wordmark';
import { COLORS } from '@/constants/theme';

interface IAppSplashScreenProps {
  message?: string;
}

export const AppSplashScreen: React.FC<IAppSplashScreenProps> = ({
  message = 'Đang khởi động không gian may đo...',
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Hiệu ứng fade-in nhẹ nhàng khi mở màn hình
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // 2. Vòng lặp thanh tiến trình hairline quét mượt mà (60fps native driver)
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [fadeAnim, shimmerAnim]);

  // Di chuyển thanh ánh sáng hairline ngang qua thanh track (độ rộng track 140px)
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 150],
  });

  return (
    <View
      className="flex-1 bg-landing-paper items-center justify-between"
      style={{
        paddingTop: Math.max(insets.top, 24),
        paddingBottom: Math.max(insets.bottom, 24),
      }}
    >
      {/* Header spacer để căn giữa nội dung */}
      <View className="h-10 w-full" />

      {/* Khối trung tâm: Logo thương hiệu StAie. & Loading Hairline */}
      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Wordmark StAie. kích thước lớn */}
        <Wordmark size="xl" variant="dark" />

        {/* Tagline định vị phong cách Atelier & AI */}
        <Text className="mt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.26em] text-brass-ink">
          Atelier & AI Styling
        </Text>

        {/* Thanh tiến trình hairline thanh mảnh đậm chất Editorial */}
        <View className="mt-8 h-[2px] w-[140px] overflow-hidden rounded-full bg-landing-line/60">
          <Animated.View
            style={[
              styles.hairlineBar,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>

        {/* Thông điệp trạng thái nhỏ gọn, tinh tế */}
        <Text className="mt-4 font-sans text-[12px] font-normal tracking-wide text-landing-muted">
          {message}
        </Text>
      </Animated.View>

      {/* Footer bản quyền & phong cách thiết kế Saigon Editorial */}
      <Animated.View style={{ opacity: fadeAnim }} className="items-center">
        <Text className="font-mono text-[9px] uppercase tracking-[0.24em] text-landing-muted/50">
          Saigon Editorial · Made-to-Measure
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hairlineBar: {
    width: 60,
    height: '100%',
    backgroundColor: COLORS.oxblood,
    borderRadius: 9999,
  },
});

export default AppSplashScreen;
