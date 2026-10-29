import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, ArrowUpRight } from 'lucide-react-native';
import { LandingSectionHeading } from './LandingSectionHeading';
import { formatProductPrice, getProductMainImage } from '@/features/products/utils/product-display';
import type { IProduct } from '@/features/products/types/product';

interface AiStylistCapsuleProps {
  products: IProduct[];
  onPressStylist: () => void;
  onPressProduct: (productId: string) => void;
}

const ROLES = ['Lớp ngoài', 'Nền', 'Điểm nhấn'] as const;

const FALLBACK_CAPSULE = [
  {
    id: 'capsule-1',
    name: 'Áo khoác dạ nữ dáng dài phom ôm',
    price: 1850000,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=85',
  },
  {
    id: 'capsule-2',
    name: 'Sơ mi lụa cổ nơ thanh lịch',
    price: 790000,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=85',
  },
  {
    id: 'capsule-3',
    name: 'Quần âu xếp ly dáng suông',
    price: 920000,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=85',
  },
];

export function AiStylistCapsule({
  products,
  onPressStylist,
  onPressProduct,
}: AiStylistCapsuleProps) {
  const items = products.length >= 3 ? products.slice(0, 3) : FALLBACK_CAPSULE;

  return (
    <View className="bg-landing-ivory px-lg py-16">
      {/* Chapter 06 Section Heading */}
      <LandingSectionHeading
        chapter="06"
        eyebrow="AI STYLIST"
        title="MỘT BỘ ĐỒ, BA MẢNH GHÉP."
        description="Chọn từ catalog thật, AI Stylist gợi ý cách phối theo dịp và phong cách của bạn. Đây là một capsule mở đầu, không phải một bộ đồ bắt buộc."
      />

      {/* Board Card */}
      <View className="mt-8 overflow-hidden rounded-3xl bg-landing-paper p-5 border border-landing-line/50">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color="#7C5722" />
            <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-landing-obsidian/80">
              Bàn phối đồ
            </Text>
          </View>
          <Text className="font-mono text-[10px] uppercase tracking-[0.2em] text-landing-muted">
            Capsule 03 món
          </Text>
        </View>

        {/* 3 Pieces Layout */}
        <View className="flex-row gap-3">
          {/* Main Piece (Lead item) */}
          <Pressable
            accessibilityRole="button"
            onPress={() => onPressProduct(items[0].id)}
            className="relative aspect-[3/4] flex-1 overflow-hidden rounded-subtle bg-landing-ivory border border-landing-line/40 active:opacity-85"
          >
            <Image
              source={{ uri: (items[0] as any).image || getProductMainImage(items[0] as any) }}
              contentFit="cover"
              contentPosition="top"
              style={{ width: '100%', height: '100%' }}
            />
            <View className="absolute left-2 top-2 rounded-subtle bg-landing-obsidian px-2 py-0.5">
              <Text className="font-mono text-[9px] font-semibold uppercase tracking-wider text-landing-paper">
                <Text className="text-landing-brass">01 </Text>
                {ROLES[0]}
              </Text>
            </View>
          </Pressable>

          {/* Secondary 2 Pieces stacked */}
          <View className="flex-1 gap-3">
            {items.slice(1, 3).map((item, idx) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => onPressProduct(item.id)}
                className="relative aspect-[3/2] flex-1 overflow-hidden rounded-subtle bg-landing-ivory border border-landing-line/40 active:opacity-85"
              >
                <Image
                  source={{ uri: (item as any).image || getProductMainImage(item as any) }}
                  contentFit="cover"
                  contentPosition="top"
                  style={{ width: '100%', height: '100%' }}
                />
                <View className="absolute left-2 top-2 rounded-subtle bg-landing-obsidian px-1.5 py-0.5">
                  <Text className="font-mono text-[8px] font-semibold uppercase tracking-wider text-landing-paper">
                    <Text className="text-landing-brass">0{idx + 2} </Text>
                    {ROLES[idx + 1]}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Itemized Credits List */}
        <View className="mt-5 border-t border-landing-line/50 pt-3">
          {items.map((item, idx) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => onPressProduct(item.id)}
              className="flex-row items-center justify-between py-2 border-b border-landing-line/30 last:border-b-0 active:opacity-75"
            >
              <View className="flex-row items-center gap-2 flex-1 mr-2">
                <Text className="font-mono text-[10px] text-landing-brass-ink">
                  0{idx + 1}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-sans text-[12px] font-medium text-landing-obsidian flex-1"
                >
                  {item.name}
                </Text>
              </View>
              <Text className="font-mono text-[11px] font-semibold text-landing-oxblood">
                {formatProductPrice(item.price)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Occasions tag */}
      <View className="mt-5">
        <Text className="font-sans text-[11px] leading-relaxed text-landing-muted">
          <Text className="font-semibold uppercase tracking-wider text-landing-obsidian">
            Phối theo dịp
          </Text>{' '}
          / Công sở · Gặp đối tác · Sự kiện tối · Cuối tuần
        </Text>
      </View>

      {/* Stylist CTA */}
      <View className="mt-6">
        <Pressable
          accessibilityRole="button"
          onPress={onPressStylist}
          className="min-h-12 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-landing-oxblood px-6 active:opacity-90"
        >
          <Sparkles size={14} color="#EFE9E1" />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
            Nhờ AI Stylist phối đồ
          </Text>
          <ArrowUpRight size={14} color="#EFE9E1" />
        </Pressable>
      </View>
    </View>
  );
}

