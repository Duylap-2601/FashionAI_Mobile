import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

interface SaleBannerTextProps {
  onPressShop: () => void;
  onPressTryOn: () => void;
}

// Not mounted on Home: FE decided "No sale banner" (FashionAI_FE/DESIGN.md › Decisions Log).
// Kept as an honest ivory call-to-action block: no sale percentage, season offer
// or AI vendor name that the backend does not back.
export function SaleBannerText({ onPressShop, onPressTryOn }: SaleBannerTextProps) {
  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="items-center border-y border-landing-line bg-landing-ivory px-lg py-8">
      <View className="mb-3 flex-row items-center gap-2">
        <Sparkles size={12} strokeWidth={1.75} color={COLORS.brassInk} />
        <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
          May đo công sở
        </Text>
      </View>

      <Text
        accessibilityRole="header"
        style={{
          fontFamily: fontFamilyDisplay,
          fontSize: 24,
          lineHeight: 30,
          color: COLORS.obsidian,
          textAlign: 'center',
        }}
      >
        Bộ sưu tập công sở
      </Text>

      <Text className="mb-5 mt-2 max-w-[340px] text-center font-sans text-[13px] leading-relaxed text-landing-muted">
        Nâng tầm phong cách công sở với thiết kế may theo số đo của bạn. Thử đồ AI trước khi chốt đơn.
      </Text>

      <View className="w-full max-w-[320px] gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onPressShop}
          className="h-11 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-landing-oxblood px-5 active:opacity-90"
        >
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
            Mua ngay
          </Text>
          <ArrowUpRight size={14} color={COLORS.paper} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onPressTryOn}
          className="h-11 w-full items-center justify-center rounded-subtle border border-landing-line px-5 active:opacity-70"
        >
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
            Thử đồ AI
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
