import React, { useId, useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ExpandableText } from '@/components/common/ExpandableText';
import { COLORS } from '@/constants/theme';
import { LandingSectionHeading } from './LandingSectionHeading';
import { LOOKBOOK_FALLBACK, type LandingLook } from '../constants/landing-lookbook';
import type { Collection } from '@/features/collections/types/collection';

interface EditorialLookbookProps {
  collection?: Collection | null;
  onPressTryOn: () => void;
}

// Chapter 04, mirrors FE EditorialLookbook: one portrait plate, look details,
// previous/next controls and a thumbnail selector, on obsidian.
export function EditorialLookbook({
  collection,
  onPressTryOn,
}: EditorialLookbookProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrimId = useId().replace(/:/g, '');

  const realImages = collection?.coverImages?.filter(Boolean) ?? [];
  const looks: LandingLook[] =
    realImages.length > 0
      ? realImages.slice(0, 3).map((img, idx) => {
          const fallback = LOOKBOOK_FALLBACK[idx % LOOKBOOK_FALLBACK.length];
          return {
            id: `${collection?.id ?? 'look'}-${idx}`,
            image: { uri: img },
            title: collection?.name || fallback.title,
            subtitle: collection?.description || fallback.subtitle,
          };
        })
      : LOOKBOOK_FALLBACK;

  const safeIndex = activeIndex % looks.length;
  const activeLook = looks[safeIndex] || looks[0];
  const hasMultipleLooks = looks.length > 1;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + looks.length) % looks.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % looks.length);
  };

  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';
  const lookNumber = String(safeIndex + 1).padStart(2, '0');

  return (
    <View className="bg-landing-obsidian px-lg py-16">
      {/* Chapter 04 Section Heading */}
      <LandingSectionHeading
        inverted
        chapter="04"
        eyebrow="Lookbook"
        action={
          <Pressable
            accessibilityRole="button"
            onPress={onPressTryOn}
            className="min-h-11 flex-row items-center gap-1.5 active:opacity-75"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-brass">
              Thử outfit
            </Text>
            <ArrowUpRight size={14} color={COLORS.brass} />
          </Pressable>
        }
      />

      {/* Featured plate with brass corner brackets */}
      <View className="mt-8 items-center">
        <View className="relative aspect-[3/4] w-full max-w-[360px] bg-landing-paper/5">
          <Image
            source={activeLook.image}
            accessibilityLabel={`${activeLook.title} - ${activeLook.subtitle}`}
            contentFit="cover"
            contentPosition="top"
            transition={200}
            style={StyleSheet.absoluteFill}
          />

          {/* Bottom scrim (FE from-obsidian/35) */}
          <View pointerEvents="none" className="absolute inset-0">
            <Svg width="100%" height="100%" accessibilityElementsHidden>
              <Defs>
                <LinearGradient id={scrimId} x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={COLORS.obsidian} stopOpacity={0.35} />
                  <Stop offset="0.5" stopColor={COLORS.obsidian} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${scrimId})`} />
            </Svg>
          </View>

          <View
            pointerEvents="none"
            className="absolute -right-3 -top-3 h-16 w-16 border-r-2 border-t-2 border-landing-brass"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-3 -left-3 h-16 w-16 border-b-2 border-l-2 border-landing-brass"
          />

          <Text className="absolute left-4 top-4 font-mono text-[11px] tracking-[0.18em] text-landing-paper/70">
            {lookNumber}
          </Text>
        </View>
      </View>

      {/* Look navigation and details */}
      <View className="mt-8">
        <View className="flex-row items-center justify-between border-t border-landing-paper/15 pt-4">
          <Text
            accessibilityLiveRegion="polite"
            className="font-mono text-[11px] tracking-[0.18em] text-landing-paper/55"
          >
            Look {lookNumber} / {String(looks.length).padStart(2, '0')}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Look trước"
              accessibilityState={{ disabled: !hasMultipleLooks }}
              disabled={!hasMultipleLooks}
              onPress={handlePrev}
              className={`h-11 w-11 items-center justify-center rounded-subtle border border-landing-paper/25 active:opacity-70 ${
                hasMultipleLooks ? '' : 'opacity-30'
              }`}
            >
              <ChevronLeft size={16} color={COLORS.paper} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Look tiếp theo"
              accessibilityState={{ disabled: !hasMultipleLooks }}
              disabled={!hasMultipleLooks}
              onPress={handleNext}
              className={`h-11 w-11 items-center justify-center rounded-subtle border border-landing-paper/25 active:opacity-70 ${
                hasMultipleLooks ? '' : 'opacity-30'
              }`}
            >
              <ChevronRight size={16} color={COLORS.paper} />
            </Pressable>
          </View>
        </View>

        <View className="mt-6">
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-landing-brass">
            Look {lookNumber}
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 32,
              lineHeight: 37,
              letterSpacing: -0.8,
              color: COLORS.paper,
              textTransform: 'uppercase',
              marginTop: 16,
            }}
          >
            {activeLook.title}
          </Text>
          <ExpandableText
            key={activeLook.subtitle}
            className="mt-3"
            text={activeLook.subtitle}
            numberOfLines={3}
            textClassName="font-sans text-sm leading-relaxed text-landing-paper/55"
            toggleClassName="text-landing-brass"
          />

          <Pressable
            accessibilityRole="button"
            onPress={onPressTryOn}
            className="mt-6 min-h-11 flex-row items-center gap-2 self-start"
          >
            <View className="flex-row items-center gap-2 border-b border-landing-brass/50 pb-1">
              <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-landing-brass">
                Thử outfit này
              </Text>
              <ArrowUpRight size={14} color={COLORS.brass} />
            </View>
          </Pressable>
        </View>

        {/* Thumbnail selector */}
        {hasMultipleLooks ? (
          <View className="mt-8 flex-row gap-3">
            {looks.map((look, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <Pressable
                  key={look.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Xem ${look.title}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveIndex(idx)}
                  className={`relative aspect-[3/4] flex-1 overflow-hidden border ${
                    isSelected
                      ? 'border-landing-brass'
                      : 'border-transparent opacity-60'
                  }`}
                >
                  <Image
                    source={look.image}
                    contentFit="cover"
                    contentPosition="top"
                    transition={150}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text className="absolute left-2 top-2 font-mono text-[9px] tracking-[0.16em] text-landing-paper/80">
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}
