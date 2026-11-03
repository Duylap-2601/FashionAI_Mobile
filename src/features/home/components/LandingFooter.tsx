import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ChevronRight, Clock, Mail, MapPin, Phone, QrCode, Wallet } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { CONTACT } from '@/constants/contact';

type PolicyType = 'privacy' | 'terms' | 'return';

interface LandingFooterProps {
  onPressHome: () => void;
  onPressCollections: () => void;
  onPressShop: () => void;
  onPressTryOn: () => void;
  onPressStylist: () => void;
  onPressOrders: () => void;
  onPressMeasurements: () => void;
  onPressPolicy: (type: PolicyType) => void;
}

const HOTLINE = CONTACT.hotline;
const HOTLINE_HOURS = CONTACT.hotlineHours;
const SUPPORT_EMAIL = CONTACT.email;
const ADDRESS = CONTACT.address;

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-11 flex-row items-center justify-between gap-2 border-b border-landing-paper/10 py-2 last:border-b-0 active:opacity-70"
    >
      <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-paper/60">
        {label}
      </Text>
      <ChevronRight size={13} color={COLORS.brass} />
    </Pressable>
  );
}

function BottomLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-11 justify-center active:opacity-70"
    >
      <Text className="font-sans text-body-sm text-landing-paper/45">{label}</Text>
    </Pressable>
  );
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-start gap-2.5">
      <View className="pt-0.5">
        <Icon size={15} color={COLORS.brass} />
      </View>
      <View className="flex-1">{children}</View>
    </View>
  );
}

function PaymentBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 border border-landing-paper/15 bg-landing-paper/5 px-2.5 py-1.5">
      <Icon size={13} color={COLORS.brass} />
      <Text className="font-mono text-2xs font-semibold uppercase tracking-[0.12em] text-landing-paper/60">
        {label}
      </Text>
    </View>
  );
}

export function LandingFooter({
  onPressHome,
  onPressCollections,
  onPressShop,
  onPressTryOn,
  onPressStylist,
  onPressOrders,
  onPressMeasurements,
  onPressPolicy,
}: LandingFooterProps) {
  return (
    <View className="border-t border-landing-paper/10 bg-landing-obsidian px-lg pb-12 pt-12">
      {/* Brand */}
      <View>
        <Text
          style={{
            fontFamily: 'Playfair Display',
            fontWeight: '700',
            fontSize: 28,
            lineHeight: 32,
            color: COLORS.paper,
            letterSpacing: -0.5,
          }}
        >
          StAie.
        </Text>
        <Text
          style={{
            fontFamily: 'Playfair Display',
            fontWeight: '600',
            fontSize: 22,
            lineHeight: 28,
            color: COLORS.paper,
          }}
          className="mt-3"
        >
          Chuẩn dáng từ đầu. Đẹp từng đường may.
        </Text>
        <Text className="mt-4 font-sans text-body-sm leading-relaxed text-landing-paper/60">
          Nền tảng thời trang công sở cao cấp tiên phong ứng dụng công nghệ thử đồ ảo AI. Chuẩn
          dáng từ đầu, đẹp từng đường may.
        </Text>
      </View>

      {/* Explore + Policies */}
      <View className="mt-10 flex-row gap-6 border-t border-landing-paper/10 pt-8">
        <View className="flex-1">
          <Text className="font-sans text-2xs font-semibold uppercase tracking-[0.2em] text-landing-brass">
            Khám phá
          </Text>
          <View className="mt-2">
            <FooterLink label="Bộ sưu tập mới 2026" onPress={onPressCollections} />
            <FooterLink label="Blazer nữ công sở" onPress={onPressShop} />
            <FooterLink label="Suit nguyên bộ may đo" onPress={onPressShop} />
            <FooterLink label="Áo sơ mi cao cấp" onPress={onPressShop} />
            <FooterLink label="Quần tây và chân váy" onPress={onPressShop} />
            <FooterLink label="Phòng thử đồ AI" onPress={onPressTryOn} />
            <FooterLink label="AI Stylist" onPress={onPressStylist} />
          </View>
        </View>

        <View className="flex-1">
          <Text className="font-sans text-2xs font-semibold uppercase tracking-[0.2em] text-landing-brass">
            Chính sách
          </Text>
          <View className="mt-2">
            <FooterLink
              label="Đổi trả 7 ngày"
              onPress={() => onPressPolicy('return')}
            />
            <FooterLink
              label="Hướng dẫn số đo"
              onPress={onPressMeasurements}
            />
            <FooterLink label="Bảo mật" onPress={() => onPressPolicy('privacy')} />
            <FooterLink label="Điều khoản" onPress={() => onPressPolicy('terms')} />
            <FooterLink label="Tra cứu đơn hàng" onPress={onPressOrders} />
          </View>
        </View>
      </View>

      {/* Contact */}
      <View className="mt-10 border-t border-landing-paper/10 pt-8">
        <Text className="font-sans text-2xs font-semibold uppercase tracking-[0.2em] text-landing-brass">
          Liên hệ
        </Text>

        <View className="mt-3 gap-3">
          <ContactRow icon={MapPin}>
            <Text className="font-sans text-body-sm leading-relaxed text-landing-paper/60">
              {ADDRESS}
            </Text>
          </ContactRow>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Gọi hotline ${HOTLINE}`}
            onPress={() => void Linking.openURL(CONTACT.hotlineHref)}
            className="min-h-11 flex-row items-center gap-2.5 active:opacity-70"
          >
            <Phone size={15} color={COLORS.brass} />
            <Text className="font-sans text-body-sm text-landing-paper/60">
              Hotline: {HOTLINE} ({HOTLINE_HOURS})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Gửi email tới ${SUPPORT_EMAIL}`}
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            className="min-h-11 flex-row items-center gap-2.5 active:opacity-70"
          >
            <Mail size={15} color={COLORS.brass} />
            <Text className="font-sans text-body-sm text-landing-paper/60">
              {SUPPORT_EMAIL}
            </Text>
          </Pressable>

          <ContactRow icon={Clock}>
            <Text className="font-sans text-body-sm leading-relaxed text-landing-paper/60">
              {CONTACT.openingHours}
            </Text>
          </ContactRow>
        </View>

        <View className="mt-5">
          <Text className="font-sans text-2xs font-semibold uppercase tracking-[0.18em] text-landing-paper/40">
            Phương thức thanh toán
          </Text>
          <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
            <PaymentBadge icon={QrCode} label="SePay QR" />
            <PaymentBadge icon={Wallet} label="ZaloPay" />
          </View>
        </View>
      </View>

      {/* Bottom bar */}
      <View className="mt-10 border-t border-landing-paper/10 pt-6">
        <Text className="font-sans text-body-sm leading-relaxed text-landing-paper/40">
          © 2026 StAie. FashionAI. Bản quyền thuộc về FashionAI Team. All rights reserved.
        </Text>
        <View className="mt-3 flex-row flex-wrap items-center gap-x-5">
          <BottomLink label="Bảo mật" onPress={() => onPressPolicy('privacy')} />
          <BottomLink label="Điều khoản" onPress={() => onPressPolicy('terms')} />
          <BottomLink label="Trang chủ" onPress={onPressHome} />
        </View>
      </View>
    </View>
  );
}
