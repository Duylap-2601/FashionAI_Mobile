import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { Mail, CheckCircle2, Phone } from 'lucide-react-native';

export function NewsletterBar() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    setIsSubscribed(true);
    setEmail('');
    Alert.alert(
      'Thành công',
      'Đăng ký nhận bản tin thành công! Mã ưu đãi 10% đã được gửi vào hòm thư của bạn.',
    );
  };

  return (
    <View className="bg-[#15434e] py-10 px-4 border-t border-[#1b505c]">
      <View className="flex-row items-center gap-3.5 mb-3">
        <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center shrink-0 border border-white/15">
          <Mail size={22} color="#C5A880" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-[16px] font-bold uppercase tracking-tight">
            ĐĂNG KÝ NHẬN BẢN TIN BỘ SƯU TẬP
          </Text>
        </View>
      </View>

      <Text className="text-white/80 text-[12.5px] font-light leading-relaxed mb-4">
        Nhận voucher giảm 10% cho đơn hàng đầu tiên và thông báo sớm nhất khi có bộ sưu tập mới ra mắt.
      </Text>

      {isSubscribed ? (
        <View className="flex-row items-center gap-2 p-3.5 rounded-xl bg-white/10 border border-emerald-400/40 mb-4">
          <CheckCircle2 size={18} color="#34D399" />
          <Text className="text-white text-[13px] font-medium flex-1">
            Bạn đã đăng ký nhận tin thành công!
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2 mb-4">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Nhập email của bạn..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            keyboardType="email-address"
            autoCapitalize="none"
            className="flex-1 h-11 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-[13px]"
          />
          <Pressable
            onPress={handleSubmit}
            className="h-11 px-5 rounded-xl bg-[#C5A880] items-center justify-center active:opacity-90"
          >
            <Text className="text-[#1A1A24] font-bold text-[12px] uppercase tracking-wider">
              ĐĂNG KÝ
            </Text>
          </Pressable>
        </View>
      )}

      {/* Support Info */}
      <View className="pt-4 border-t border-white/10 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Phone size={14} color="#C5A880" />
          <Text className="text-white/80 text-[12px]">Hotline: 1900 8888 (08:00 - 21:00)</Text>
        </View>
        <Text className="text-white/50 text-[11px]">© 2026 StAle.</Text>
      </View>
    </View>
  );
}
