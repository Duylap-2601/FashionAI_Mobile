import React, { useState, useEffect, useCallback, useId } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { LANDING_HERO_SLIDES } from '../constants/landing-hero';
import { useReducedMotion } from '../hooks/use-reduced-motion';

interface HomeHeroBannerProps {
  onPressCollections: () => void;
  onPressTryOn: () => void;
}

export function HomeHeroBanner({
  onPressCollections,
  onPressTryOn,
}: HomeHeroBannerProps) {
  const { width } = useWindowDimensions();
  const gradientId = useId().replace(/:/g, '');
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const activeSlide = LANDING_HERO_SLIDES[activeIndex];
  const total = LANDING_HERO_SLIDES.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play every 6s like FE; off under the system reduce-motion setting.
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [handleNext, reduceMotion]);

  // FE: text-[clamp(2.1rem,10.5vw,2.7rem)] leading-[1.1] tracking-[-0.025em].
  const titleSize = Math.min(Math.max(width * 0.105, 33.6), 43.2);

  return (
    <View className="relative min-h-[560px] w-full overflow-hidden bg-landing-obsidian">
      <Image
        key={activeSlide.id}
        source={activeSlide.image}
        accessibilityLabel={`${activeSlide.name} - ${activeSlide.season}`}
        contentFit="cover"
        contentPosition="top"
        transition={300}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" className="absolute inset-0">
        <Svg width="100%" height="100%" accessibilityElementsHidden>
          <Defs>
            <LinearGradient id={`${gradientId}-left`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={COLORS.editorialShade} stopOpacity={0.72} />
              <Stop offset="0.42" stopColor={COLORS.editorialShade} stopOpacity={0.3} />
              <Stop offset="0.66" stopColor={COLORS.editorialShade} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id={`${gradientId}-bottom`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.editorialShade} stopOpacity={0.2} />
              <Stop offset="0.55" stopColor={COLORS.editorialShade} stopOpacity={0.15} />
              <Stop offset="1" stopColor={COLORS.editorialShade} stopOpacity={0.85} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId}-left)`} />
          <Rect width="100%" height="100%" fill={`url(#${gradientId}-bottom)`} />
        </Svg>
      </View>

      <View className="z-10 flex-1 justify-between px-4 pb-8 pt-14">
        <View className="max-w-[720px]">
          <View className="flex-row items-center gap-3">
            <View className="h-px w-12 bg-landing-brass" />
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-landing-brass">
              Bộ sưu tập / 2026
            </Text>
          </View>

          <View className="mt-6">
            <Text
              accessibilityRole="header"
              style={{
                fontFamily: 'Playfair Display',
                fontSize: titleSize,
                lineHeight: titleSize * 1.1,
                letterSpacing: titleSize * -0.025,
                color: COLORS.paper,
              }}
            >
              Mặc đúng{' '}
              <Text style={{ fontStyle: 'italic', color: COLORS.brass }}>dáng</Text>.
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontFamily: 'Playfair Display',
                fontSize: titleSize,
                lineHeight: titleSize * 1.1,
                letterSpacing: titleSize * -0.025,
                color: COLORS.paper,
              }}
            >
              Sống đúng{' '}
              <Text style={{ fontStyle: 'italic', color: COLORS.brass }}>chất</Text>.
            </Text>
          </View>

          <View className="mt-7 flex-col gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onPressCollections}
              className="h-12 flex-row items-center justify-center gap-3 rounded-subtle border border-landing-paper bg-landing-paper px-6 active:border-landing-brass active:bg-landing-brass"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-obsidian">
                Khám phá bộ sưu tập
              </Text>
              <ArrowUpRight size={14} color={COLORS.obsidian} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onPressTryOn}
              className="h-12 items-center justify-center rounded-subtle border border-landing-paper/35 px-6 active:opacity-70"
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
                Thử đồ AI
              </Text>
            </Pressable>
          </View>

          <View className="mt-8 flex-row items-center justify-between gap-4 border-t border-landing-paper/15 pt-4">
            <Text
              accessibilityLiveRegion="polite"
              className="font-mono text-[11px] tracking-[0.18em] text-landing-paper/55"
            >
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </Text>

            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1.5">
                {LANDING_HERO_SLIDES.map((slide, index) => (
                  <Pressable
                    key={slide.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Xem ${slide.name}`}
                    accessibilityState={{ selected: activeIndex === index }}
                    // The 6px bar stays thin; the slop lifts the touch target to 44px.
                    hitSlop={{ top: 19, bottom: 19, left: 4, right: 4 }}
                    onPress={() => setActiveIndex(index)}
                    className={`h-1.5 ${
                      activeIndex === index ? 'w-8 bg-landing-brass' : 'w-3 bg-landing-paper/30'
                    }`}
                  />
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bộ sưu tập trước"
                onPress={handlePrev}
                className="h-11 w-11 items-center justify-center rounded-subtle border border-landing-paper/25 active:opacity-70"
              >
                <ChevronLeft size={16} color={COLORS.paper} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bộ sưu tập tiếp theo"
                onPress={handleNext}
                className="h-11 w-11 items-center justify-center rounded-subtle border border-landing-paper/25 active:opacity-70"
              >
                <ChevronRight size={16} color={COLORS.paper} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
