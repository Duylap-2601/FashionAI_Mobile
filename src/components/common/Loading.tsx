import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, Text } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { COLORS } from '@/constants/theme';

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullscreen?: boolean;
}

const containerStyle = tva({
  base: 'items-center justify-center p-xl',
  variants: {
    fullscreen: {
      true: 'flex-1 bg-landing-paper',
    },
  },
});

// Kích thước khung máy may theo FE AtelierLoader (sm 58px, md 96px), tỉ lệ viewBox 120x60.
const STAGE_WIDTH = { small: 58, large: 96 } as const;
const VIEWBOX = '0 0 120 60';
// Biên độ kim (đơn vị viewBox), khớp keyframe atelier-needle của FE: -1 lên, 4 xuống.
const NEEDLE_UP = -1;
const NEEDLE_DOWN = 4;

/**
 * Loader Atelier: máy may nét mảnh đang chạy mũi chỉ, giống `AtelierLoader` của FE.
 * Khung tĩnh vẽ bằng react-native-svg; chỉ cây kim nhún lên xuống bằng Animated (native driver),
 * và đứng yên khi người dùng bật giảm chuyển động.
 */
function AtelierStage({ width }: { width: number }) {
  const height = width / 2;
  const scale = width / 120;
  const [needle] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(needle, {
          toValue: 1,
          duration: 255,
          easing: Easing.bezier(0.5, 0, 0.5, 1),
          useNativeDriver: true,
        }),
        Animated.delay(130),
        Animated.timing(needle, {
          toValue: 0,
          duration: 210,
          easing: Easing.bezier(0.5, 0, 0.5, 1),
          useNativeDriver: true,
        }),
        Animated.delay(255),
      ]),
    );

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!cancelled && !reduceMotion) loop.start();
      })
      .catch(() => {
        if (!cancelled) loop.start();
      });

    return () => {
      cancelled = true;
      loop.stop();
    };
  }, [needle]);

  const translateY = needle.interpolate({
    inputRange: [0, 1],
    outputRange: [NEEDLE_UP * scale, NEEDLE_DOWN * scale],
  });

  // Kích thước khung là giá trị tính theo prop `size`, nên để ở style.
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={VIEWBOX} fill="none">
        <Path
          d="M33 8C50 0 73 3 83 25"
          stroke={COLORS.brass}
          strokeWidth={0.9}
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <G stroke={COLORS.brass} strokeWidth={1.1} strokeLinecap="round">
          <Circle cx={30} cy={10} r={5.5} />
          <Path d="M30 6.5v7M26.5 10h7" />
        </G>
        <G stroke={COLORS.brass} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 44V14h66v16" />
          <Path d="M8 44h104" />
          <Path d="M12 33h6" />
        </G>
        <Circle cx={12} cy={33} r={4} stroke={COLORS.brass} strokeWidth={1.2} />
        <Path d="M79 38h9" stroke={COLORS.brass} strokeWidth={1.1} strokeLinecap="round" />
        <Rect x={16} y={40} width={92} height={4} rx={1} fill={COLORS.taupe} fillOpacity={0.38} />
        <Path
          d="M20 42h64"
          stroke={COLORS.oxblood}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
        <Circle cx={84} cy={20} r={1.6} fill={COLORS.oxblood} />
      </Svg>
      <View pointerEvents="none" className="absolute left-0 top-0">
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Svg width={width} height={height} viewBox={VIEWBOX} fill="none">
            <G stroke={COLORS.oxblood} strokeWidth={1.4} strokeLinecap="round">
              <Path d="M84 30v13" />
              <Path d="M81 33h6" />
            </G>
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Đang tải',
  size = 'large',
  fullscreen = false,
}) => {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Đang tải'}
      accessibilityLiveRegion="polite"
      className={containerStyle({ fullscreen })}
    >
      <AtelierStage width={STAGE_WIDTH[size]} />
      {message ? (
        <Text className="mt-sm text-center font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-landing-muted">
          {message}
        </Text>
      ) : null}
    </View>
  );
};

export default Loading;
