import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { IProduct } from '../types/product';

type OutfitTone = 'full' | 'lower' | 'upper';

interface OutfitCard {
  title: string;
  description: string;
}

interface OutfitCopy {
  intro: [string, string];
  cards: [OutfitCard, OutfitCard];
}

const OUTFIT_COPY: Record<OutfitTone, OutfitCopy> = {
  full: {
    intro: [
      'Set trang phục ',
      ' đủ lịch lãm cho ngày làm việc và linh hoạt khi cần dự sự kiện.',
    ],
    cards: [
      {
        title: 'Sự kiện và hội nghị',
        description:
          'Kết hợp sơ mi trắng, cà vạt lụa và giày Oxford hoặc Derby.',
      },
      {
        title: 'Doanh nhân hiện đại',
        description:
          'Mặc cùng áo thun hoặc áo len mỏng và giày loafer thanh lịch.',
      },
    ],
  },
  lower: {
    intro: [
      'Thiết kế ',
      ' tôn dáng và là điểm nhấn cho tổng thể trang phục công sở.',
    ],
    cards: [
      {
        title: 'Phong cách công sở',
        description:
          'Phối cùng sơ mi trắng, sơ vin gọn gàng và khoác thêm blazer.',
      },
      {
        title: 'Năng động dạo phố',
        description:
          'Mặc cùng áo polo basic, áo dệt kim và giày loafer hoặc sneaker.',
      },
    ],
  },
  upper: {
    intro: [
      'Mẫu ',
      ' là món cốt lõi trong tủ đồ, dễ biến hóa nhiều phong cách.',
    ],
    cards: [
      {
        title: 'Công sở',
        description:
          'Kết hợp quần tây navy hoặc xám đậm, khoác thêm blazer khi cần.',
      },
      {
        title: 'Smart casual',
        description:
          'Mặc cùng quần chino kaki hoặc jeans tối màu, xắn tay áo nhẹ nhàng.',
      },
    ],
  },
};

function resolveTone(category: IProduct['category']): OutfitTone {
  if (category === 'FULL_BODY') return 'full';
  if (category === 'LOWER') return 'lower';
  return 'upper';
}

interface ProductOutfitSuggestionsProps {
  product: IProduct;
  onAskStylist: () => void;
}

export function ProductOutfitSuggestions({
  product,
  onAskStylist,
}: ProductOutfitSuggestionsProps) {
  const copy = OUTFIT_COPY[resolveTone(product.category)];

  return (
    <View className="gap-md border-t border-landing-line pt-xl">
      <Text
        accessibilityRole="header"
        className="font-display text-headline-md font-normal text-landing-obsidian"
      >
        Gợi ý phối đồ
      </Text>
      <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
        {copy.intro[0]}
        <Text className="font-semibold text-landing-obsidian">{product.name}</Text>
        {copy.intro[1]}
      </Text>

      <View className="gap-sm">
        {copy.cards.map((card) => (
          <View
            key={card.title}
            className="gap-xs rounded-subtle border border-landing-line bg-ivory p-md"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-ink">
              {card.title}
            </Text>
            <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
              {card.description}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-md rounded-subtle border border-landing-line bg-ivory p-md">
        <View className="gap-xs">
          <Text className="font-sans text-body-sm font-semibold text-landing-obsidian">
            Tư vấn phối đồ theo dáng người
          </Text>
          <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
            Hỏi AI Stylist cách mix và match sản phẩm này.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hỏi AI Stylist cách phối đồ"
          onPress={onAskStylist}
          className="min-h-11 flex-row items-center justify-center gap-sm rounded-subtle border border-landing-line px-md active:opacity-70"
        >
          <Sparkles size={16} strokeWidth={1.75} color={COLORS.obsidian} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian">
            Hỏi AI Stylist
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
