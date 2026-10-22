import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import type { Collection } from '@/features/collections/types/collection';

interface EditorialLookbookProps {
  collection?: Collection | null;
  onPressTryOn: () => void;
}

const DEFAULT_LOOKS = [
  {
    url: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1000&q=85',
    title: 'THE MONOCHROME ESSENCE',
    subtitle: 'Blazer dáng ôm & Quần âu xếp ly',
    category: 'LOOK 01',
  },
  {
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1000&q=85',
    title: 'URBAN POWER DRESSING',
    subtitle: 'Suit hai hàng khuy dáng quyền lực',
    category: 'LOOK 02',
  },
  {
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1000&q=85',
    title: 'CONTEMPORARY CHIC',
    subtitle: 'Sơ mi lụa cổ nơ & Chân váy midi',
    category: 'LOOK 03',
  },
];

export function EditorialLookbook({ collection, onPressTryOn }: EditorialLookbookProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.78, 290);

  const sectionTitle = collection?.name
    ? collection.name.toUpperCase()
    : 'LOOKBOOK 2026: SẮC VÓC LÃNH ĐẠO';

  const sectionSubtitle = collection?.description
    ? collection.description
    : 'Mỗi góc nhìn là một lời khẳng định cho phong cách chuyên nghiệp, thanh lịch và tự tin nơi công sở.';

  return (
    <View className="py-12 bg-[#0F172A]">
      {/* Header */}
      <View className="px-5 items-center mb-6">
        <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-2.5">
          <Sparkles size={11} color="#C5A880" />
          <Text className="text-[#C5A880] text-[10px] font-bold tracking-widest uppercase">
            EDITORIAL CAMPAIGN
          </Text>
        </View>

        <Text
          numberOfLines={2}
          className="text-white text-[22px] font-extrabold uppercase text-center tracking-tight mb-2"
        >
          {sectionTitle}
        </Text>

        <Text
          numberOfLines={3}
          className="text-neutral-400 text-[12.5px] font-light text-center leading-relaxed max-w-[340px]"
        >
          {sectionSubtitle}
        </Text>
      </View>

      {/* Lookbook Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
      >
        {DEFAULT_LOOKS.map((look, i) => (
          <View
            key={i}
            style={{ width: cardWidth, height: cardWidth / (9 / 14) }}
            className="rounded-2xl overflow-hidden relative shadow-2xl border border-white/10 justify-end p-5"
          >
            <Image
              source={{ uri: look.url }}
              contentFit="cover"
              transition={200}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Gradient Overlay */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
              }}
            />

            {/* Content & Action */}
            <View className="relative z-10">
              <Text className="text-[11px] font-bold tracking-[0.2em] text-[#C5A880] uppercase mb-1">
                {look.category}
              </Text>
              <Text className="text-[15px] font-bold text-white mb-0.5">
                {look.title}
              </Text>
              <Text className="text-[12px] text-white/80 font-light mb-3" numberOfLines={1}>
                {look.subtitle}
              </Text>

              <Pressable
                onPress={onPressTryOn}
                className="self-start flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 border border-white/30 backdrop-blur-md active:bg-white"
              >
                <Text className="text-white font-bold text-[11px] uppercase tracking-wider">
                  Thử outfit này
                </Text>
                <ArrowUpRight size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
