import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Platform } from 'react-native';
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
      'Đăng ký nhận bản tin thành công! Thông tin bộ sưu tập mới sẽ được gửi vào hòm thư của bạn.',
    );
  };

  const fontFamilyDisplay = Platform.OS === 'ios' ? 'Playfair Display' : 'serif';

  return (
    <View className="border-t border-landing-paper/10 bg-landing-obsidian px-lg py-12">
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-subtle border border-landing-brass/30 bg-landing-brass/10">
          <Mail size={18} color="#A67D44" />
        </View>
        <View className="flex-1">
          <Text
            style={{
              fontFamily: fontFamilyDisplay,
              fontSize: 18,
              lineHeight: 22,
              color: '#EFE9E1',
              fontWeight: '700',
            }}
          >
            Đăng ký bản tin Atelier
          </Text>
        </View>
      </View>

      <Text className="mb-4 font-sans text-[12px] leading-relaxed text-landing-paper/70">
        Nhận thông báo sớm nhất khi có bộ sưu tập mới và các bài viết về phong cách may đo chuẩn dáng.
      </Text>

      {isSubscribed ? (
        <View className="mb-4 flex-row items-center gap-2 rounded-subtle border border-landing-sage/40 bg-landing-sage/10 p-3.5">
          <CheckCircle2 size={16} color="#899481" />
          <Text className="flex-1 font-sans text-[12px] font-medium text-landing-paper">
            Bạn đã đăng ký nhận tin thành công!
          </Text>
        </View>
      ) : (
        <View className="mb-5 flex-row items-center gap-2">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Nhập email của bạn..."
            placeholderTextColor="rgba(239, 233, 225, 0.45)"
            keyboardType="email-address"
            autoCapitalize="none"
            className="h-11 flex-1 rounded-subtle border border-landing-paper/20 bg-landing-paper/5 px-3.5 font-sans text-[12px] text-landing-paper"
          />
          <Pressable
            onPress={handleSubmit}
            className="h-11 items-center justify-center rounded-subtle bg-landing-oxblood px-5 active:opacity-90"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-wider text-landing-paper">
              Đăng ký
            </Text>
          </Pressable>
        </View>
      )}

      {/* Brand Footer */}
      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-landing-paper/10 pt-4">
        <View className="flex-row items-center gap-2">
          <Phone size={13} color="#A67D44" />
          <Text className="font-sans text-[11px] text-landing-paper/70">
            Hotline: 1900 8888 (08:00 - 21:00)
          </Text>
        </View>
        <Text className="font-mono text-[10px] text-landing-paper/40">
          © 2026 StAie. Atelier Paper
        </Text>
      </View>
    </View>
  );
}
