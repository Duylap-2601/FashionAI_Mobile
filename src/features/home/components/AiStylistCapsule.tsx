import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, ArrowUpRight } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { STYLIST_OCCASIONS } from '@/features/stylist/constants/stylist-options';
import { LandingSectionHeading } from './LandingSectionHeading';
import { formatProductPrice, getProductMainImage } from '@/features/products/utils/product-display';
import type { IProduct } from '@/features/products/types/product';

interface AiStylistCapsuleProps {
  products: IProduct[];
  onPressStylist: () => void;
  onPressProduct: (productId: string) => void;
}

const ROLES = ['Lớp ngoài', 'Nền', 'Điểm nhấn'] as const;

function pieceNumber(index: number) {
  return String(index + 1).padStart(2, '0');
}

function CapsulePiece({
  product,
  index,
  lead,
  onPress,
}: {
  product: IProduct;
  index: number;
  lead: boolean;
  onPress: (productId: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getProductMainImage(product);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ROLES[index]}: ${product.name}`}
      onPress={() => onPress(product.id)}
      className={`relative flex-1 overflow-hidden rounded-subtle border border-landing-line bg-landing-ivory active:opacity-85 ${
        lead ? 'aspect-[3/4]' : ''
      }`}
    >
      {imageUrl && !failed ? (
        <Image
          source={{ uri: imageUrl }}
          contentFit="contain"
          contentPosition="top"
          onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, { margin: 12 }]}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="font-sans text-[10px] uppercase tracking-[0.16em] text-landing-muted">
            Chưa có ảnh
          </Text>
        </View>
      )}
      <View className="absolute left-0 top-3 flex-row items-center gap-2 bg-landing-obsidian px-2.5 py-1.5">
        <Text className="font-mono text-[9px] font-semibold text-landing-brass">
          {pieceNumber(index)}
        </Text>
        <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
          {ROLES[index]}
        </Text>
      </View>
    </Pressable>
  );
}

// Chapter 06, mirrors FE AiStylistCapsule: a styling board built only from real
// catalog products, a credits list, occasions and one AI Stylist CTA.
export function AiStylistCapsule({
  products,
  onPressStylist,
  onPressProduct,
}: AiStylistCapsuleProps) {
  // Real catalog pieces only (FE renders nothing without products); no invented
  // names, prices or stock photos.
  const items = products.slice(0, 3);

  if (items.length === 0) return null;

  const [lead, ...rest] = items;

  return (
    <View className="bg-landing-ivory px-lg py-16">
      <LandingSectionHeading
        chapter="06"
        eyebrow="AI Stylist"
        title="Một capsule, ba lớp."
        description="Chọn từ catalog thật, AI Stylist gợi ý cách phối theo dịp và phong cách của bạn. Đây là một capsule mở đầu, không phải một bộ đồ bắt buộc."
      />

      {/* Styling board */}
      <View className="mt-8 rounded-subtle border border-landing-line bg-landing-paper p-5">
        <View className="mb-5 flex-row items-center justify-between gap-4">
          <View className="flex-row items-center gap-2">
            <Sparkles size={14} strokeWidth={1.75} color={COLORS.brassInk} />
            <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-landing-obsidian/70">
              Bàn phối đồ
            </Text>
          </View>
          <Text className="font-mono text-[9px] uppercase tracking-[0.2em] text-landing-muted">
            Capsule {String(items.length).padStart(2, '0')} món
          </Text>
        </View>

        <View className="flex-row gap-3">
          <CapsulePiece product={lead} index={0} lead onPress={onPressProduct} />
          {rest.length > 0 ? (
            <View className="flex-1 gap-3">
              {rest.map((item, idx) => (
                <CapsulePiece
                  key={item.id}
                  product={item}
                  index={idx + 1}
                  lead={false}
                  onPress={onPressProduct}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Credits */}
      <View className="mt-8 rounded-subtle bg-landing-paper px-5 py-5">
        <Text className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
          Cách phối
        </Text>
        <View className="mt-2">
          {items.map((item, idx) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${ROLES[idx]}: ${item.name}, ${formatProductPrice(item.price)}`}
              onPress={() => onPressProduct(item.id)}
              className={`min-h-11 flex-row items-center gap-3 py-3.5 active:opacity-75 ${
                idx < items.length - 1 ? 'border-b border-landing-line' : ''
              }`}
            >
              <Text className="w-8 font-mono text-[11px] tracking-[0.16em] text-landing-brass-ink">
                {pieceNumber(idx)}
              </Text>
              <View className="flex-1">
                <Text className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-landing-muted">
                  {ROLES[idx]}
                </Text>
                <Text
                  numberOfLines={2}
                  className="mt-0.5 font-sans text-sm font-medium leading-relaxed text-landing-obsidian"
                >
                  {item.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="font-mono text-[11px] text-landing-oxblood">
                  {formatProductPrice(item.price)}
                </Text>
                <ArrowUpRight size={14} strokeWidth={1.75} color={COLORS.muted} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Occasions: the real AI Stylist options */}
      <Text className="mt-6 font-sans text-xs leading-relaxed text-landing-muted">
        <Text className="font-semibold uppercase tracking-[0.16em] text-landing-obsidian/70">
          Phối theo dịp
        </Text>
        <Text className="text-landing-line">{'  /  '}</Text>
        {STYLIST_OCCASIONS.join(' · ')}
      </Text>

      {/* Stylist CTA */}
      <View className="mt-8 gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onPressStylist}
          className="h-12 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-landing-oxblood px-6 active:opacity-90"
        >
          <Sparkles size={14} color={COLORS.paper} />
          <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
            Nhờ AI Stylist phối đồ
          </Text>
          <ArrowUpRight size={14} color={COLORS.paper} />
        </Pressable>
        <Text className="font-sans text-[10px] uppercase tracking-[0.16em] text-landing-muted">
          Capsule minh hoạ từ catalog hiện tại
        </Text>
      </View>
    </View>
  );
}
