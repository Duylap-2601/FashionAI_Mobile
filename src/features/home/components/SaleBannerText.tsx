import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';

interface SaleBannerTextProps {
  onPressShop: () => void;
  onPressTryOn: () => void;
}

export function SaleBannerText({ onPressShop, onPressTryOn }: SaleBannerTextProps) {
  return (
    <View className="py-8 px-4 bg-[#FAF7F2] border-y border-[#EAE3D9] items-center">
      {/* Badge */}
      <View className="flex-row items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#5D1C34]/10 mb-3">
        <Sparkles size={12} color="#5D1C34" />
        <Text className="text-[#5D1C34] text-[11px] font-bold tracking-widest uppercase">
          ƯU ĐÃI ĐẶC QUYỀN MÙA MỚI
        </Text>
      </View>

      {/* Heading */}
      <Text className="text-[22px] font-black text-neutral-900 tracking-tight text-center uppercase leading-tight mb-2">
        SALE UP TO 20%{'\n'}
        <Text className="text-[#5D1C34]">BỘ SƯU TẬP CÔNG SỞ</Text>
      </Text>

      {/* Subtitle */}
      <Text className="text-[13px] text-neutral-600 text-center leading-relaxed max-w-[340px] mb-5">
        Tối ưu chi phí, nâng tầm phong cách quý cô và quý ông công sở. Trải nghiệm thử đồ ảo AI FASHN trước khi chốt đơn.
      </Text>

      {/* Actions */}
      <View className="flex-col sm:flex-row items-center gap-3 w-full max-w-[320px]">
        <Pressable
          onPress={onPressShop}
          className="w-full h-11 rounded-full bg-[#5D1C34] flex-row items-center justify-center gap-2 shadow-md active:opacity-90"
        >
          <Text className="text-white text-[12px] font-bold tracking-wider uppercase">
            MUA NGAY BÂY GIỜ
          </Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={onPressTryOn}
          className="w-full h-11 rounded-full bg-white border border-neutral-300 flex-row items-center justify-center gap-2 shadow-xs active:opacity-90"
        >
          <Text className="text-neutral-800 text-[12px] font-semibold tracking-wider uppercase">
            THỬ ĐỒ AI MIỄN PHÍ
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
