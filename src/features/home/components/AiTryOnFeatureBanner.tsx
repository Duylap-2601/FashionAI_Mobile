import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight, Camera, CheckCircle2, Sparkles, Shirt } from 'lucide-react-native';

interface AiTryOnFeatureBannerProps {
  onPressTryOn: () => void;
}

export function AiTryOnFeatureBanner({ onPressTryOn }: AiTryOnFeatureBannerProps) {
  return (
    <View className="py-10 px-4 bg-[#F9F7F5]">
      <View className="bg-[#1A1A24] rounded-3xl overflow-hidden border border-white/10 p-6 shadow-2xl">
        {/* Badge */}
        <View className="self-start flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 mb-4">
          <Sparkles size={12} color="#C5A880" />
          <Text className="text-[#C5A880] text-[10px] font-bold uppercase tracking-wider">
            CÔNG NGHỆ THỬ ĐỒ ĐỘC QUYỀN
          </Text>
        </View>

        {/* Heading */}
        <Text className="text-white text-[22px] font-extrabold tracking-tight leading-tight mb-2.5">
          THỬ ĐỒ ẢO BẰNG AI{'\n'}
          <Text className="text-[#C5A880]">TRƯỚC KHI QUYẾT ĐỊNH MUA</Text>
        </Text>

        {/* Description */}
        <Text className="text-white/75 text-[12.5px] leading-relaxed mb-6 font-light">
          Không cần đến showroom hay băn khoăn về phom dáng. Công nghệ AI FASHN cho phép bạn ghép trực tiếp bất kỳ trang phục may đo nào lên ảnh thật của chính mình.
        </Text>

        {/* 3 Step Cards */}
        <View className="gap-2.5 mb-6">
          {/* Step 1 */}
          <View className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
              <Shirt size={20} color="#C5A880" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[10px] font-bold text-[#C5A880] tracking-widest uppercase">
                  BƯỚC 01
                </Text>
                <Text className="text-[13px] font-bold text-white">Chọn trang phục</Text>
              </View>
              <Text className="text-white/60 text-[11.5px] mt-0.5">
                Chọn món đồ bạn muốn thử từ các bộ sưu tập.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
              <Camera size={20} color="#C5A880" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[10px] font-bold text-[#C5A880] tracking-widest uppercase">
                  BƯỚC 02
                </Text>
                <Text className="text-[13px] font-bold text-white">Tải ảnh của bạn</Text>
              </View>
              <Text className="text-white/60 text-[11.5px] mt-0.5">
                Ảnh chụp rõ toàn thân đứng thẳng tự nhiên.
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
              <CheckCircle2 size={20} color="#34D399" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[10px] font-bold text-[#C5A880] tracking-widest uppercase">
                  BƯỚC 03
                </Text>
                <Text className="text-[13px] font-bold text-white">Xem kết quả 30s</Text>
              </View>
              <Text className="text-white/60 text-[11.5px] mt-0.5">
                AI xuất ảnh chân thực chuẩn phom để bạn ưng ý.
              </Text>
            </View>
          </View>
        </View>

        {/* Demo Result Preview Card */}
        <View className="h-60 rounded-2xl overflow-hidden relative border border-white/15 mb-6 justify-end p-4">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1616065297556-f05bc00c9a3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=85',
            }}
            contentFit="cover"
            transition={200}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
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

          {/* Top Pill */}
          <View className="absolute top-3.5 right-3.5 px-3 py-1 bg-emerald-600 rounded-full flex-row items-center gap-1.5 shadow-md">
            <CheckCircle2 size={12} color="#FFFFFF" />
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
              Kết quả AI thử đồ
            </Text>
          </View>

          {/* Bottom Info */}
          <View className="relative z-10">
            <Text className="text-[#C5A880] text-[10.5px] font-bold uppercase tracking-wider mb-0.5">
              MẪU THỬ CÔNG SỞ
            </Text>
            <Text className="text-white text-[15px] font-bold mb-1">
              Blazer Nữ Công Sở Dáng Ôm
            </Text>
            <Text className="text-white/70 text-[11px]">
              Độ chuẩn xác 95% • Tự động điều chỉnh theo số đo
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={onPressTryOn}
          className="w-full h-12 rounded-full bg-[#C5A880] flex-row items-center justify-center gap-2 shadow-xl active:opacity-90"
        >
          <Text className="text-[#1A1A24] font-extrabold text-[12.5px] tracking-wider uppercase">
            TRẢI NGHIỆM VIRTUAL TRY-ON NGAY
          </Text>
          <ArrowRight size={15} color="#1A1A24" />
        </Pressable>
      </View>
    </View>
  );
}
