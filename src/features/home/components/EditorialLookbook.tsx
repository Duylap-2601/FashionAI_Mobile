import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ExpandableText } from '@/components/common/ExpandableText';
import { LandingSectionHeading } from './LandingSectionHeading';
import type { Collection } from '@/features/collections/types/collection';

interface EditorialLookbookProps {
  collection?: Collection | null;
  onPressTryOn: () => void;
}

const DEFAULT_LOOKS = [
  {
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&q=85',
    title: 'The Monochrome Edit',
    subtitle: 'Blazer đen, chân váy trắng, một đường cắt sắc.',
  },
  {
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&q=85',
    title: 'Soft Structure',
    subtitle: 'Suit be hai hàng khuy cho nhịp làm việc chậm lại.',
  },
  {
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200&q=85',
    title: 'Quiet Tailoring',
    subtitle: 'Sơ mi trắng và quần tây xám, chuẩn mực mỗi ngày.',
  },
];

export function EditorialLookbook({
  collection,
  onPressTryOn,
}: EditorialLookbookProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const realImages = collection?.coverImages?.filter(Boolean) ?? [];
  const looks =
    realImages.length > 0
      ? realImages.slice(0, 3).map((img, idx) => ({
          url: img,
          title: collection?.name || DEFAULT_LOOKS[idx % DEFAULT_LOOKS.length].title,
          subtitle:
            collection?.description || DEFAULT_LOOKS[idx % DEFAULT_LOOKS.length].subtitle,
        }))
      : DEFAULT_LOOKS;

  const activeLook = looks[activeIndex] || looks[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + looks.length) % looks.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % looks.length);
  };

  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="bg-landing-obsidian px-lg py-16">
      {/* Chapter 04 Section Heading */}
      <LandingSectionHeading
        inverted
        chapter="04"
        eyebrow="LOOKBOOK"
        action={
          <Pressable
            accessibilityRole="button"
            onPress={onPressTryOn}
            className="flex-row items-center gap-1.5 active:opacity-75"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-brass">
              Thử outfit
            </Text>
            <ArrowUpRight size={14} color="#A67D44" />
          </Pressable>
        }
      />

      {/* Main Look Display with Brass Framing Brackets */}
      <View className="mt-8 items-center">
        <View className="relative aspect-[3/4] w-full max-w-[360px] bg-landing-paper/5">
          <Image
            source={{ uri: activeLook.url }}
            contentFit="cover"
            contentPosition="top"
            transition={200}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Scrim Overlay */}
          <View className="absolute inset-0 bg-gradient-to-t from-landing-obsidian/40 via-transparent to-transparent" />

          {/* Brass Corner Brackets */}
          <View
            pointerEvents="none"
            className="absolute -top-2.5 -right-2.5 h-12 w-12 border-r-2 border-t-2 border-landing-brass"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-2.5 -left-2.5 h-12 w-12 border-b-2 border-l-2 border-landing-brass"
          />

          {/* Look Number */}
          <Text className="absolute left-4 top-4 font-mono text-[11px] tracking-[0.18em] text-landing-paper/80">
            {String(activeIndex + 1).padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* Look Navigation and Details */}
      <View className="mt-8">
        <View className="flex-row items-center justify-between border-t border-landing-paper/15 pt-4">
          <Text className="font-mono text-[11px] tracking-[0.18em] text-landing-paper/60">
            Look {String(activeIndex + 1).padStart(2, '0')} / {String(looks.length).padStart(2, '0')}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Look trước"
              onPress={handlePrev}
              className="h-10 w-10 items-center justify-center border border-landing-paper/25 bg-transparent active:bg-landing-paper/10"
            >
              <ChevronLeft size={16} color="#EFE9E1" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Look tiếp theo"
              onPress={handleNext}
              className="h-10 w-10 items-center justify-center border border-landing-paper/25 bg-transparent active:bg-landing-paper/10"
            >
              <ChevronRight size={16} color="#EFE9E1" />
            </Pressable>
          </View>
        </View>

        <View className="mt-4">
          <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-landing-brass">
            Look {String(activeIndex + 1).padStart(2, '0')}
          </Text>
          <Text
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 26,
              lineHeight: 32,
              fontWeight: '700',
              color: '#EFE9E1',
              textTransform: 'uppercase',
              marginTop: 6,
            }}
          >
            {activeLook.title}
          </Text>
          <ExpandableText
            key={activeLook.subtitle}
            className="mt-2"
            text={activeLook.subtitle}
            numberOfLines={3}
            textClassName="font-sans text-body-sm leading-relaxed text-landing-paper/65"
            toggleClassName="text-landing-brass"
          />

          <Pressable
            accessibilityRole="button"
            onPress={onPressTryOn}
            className="mt-4 flex-row items-center gap-1.5 self-start border-b border-landing-brass/60 pb-1"
          >
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-landing-brass">
              Thử outfit này
            </Text>
            <ArrowUpRight size={12} color="#A67D44" />
          </Pressable>
        </View>

        {/* 3 Thumbnails Row */}
        <View className="mt-8 flex-row gap-3">
          {looks.map((look, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <Pressable
                key={`${look.title}-${idx}`}
                accessibilityRole="button"
                accessibilityLabel={`Xem ${look.title}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setActiveIndex(idx)}
                className={`relative aspect-[3/4] flex-1 overflow-hidden border ${
                  isSelected
                    ? 'border-2 border-landing-brass'
                    : 'border-transparent opacity-60'
                }`}
              >
                <Image
                  source={{ uri: look.url }}
                  contentFit="cover"
                  contentPosition="top"
                  transition={150}
                  style={{ width: '100%', height: '100%' }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
