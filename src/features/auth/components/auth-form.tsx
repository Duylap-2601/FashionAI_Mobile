import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Circle } from 'lucide-react-native';
import { Wordmark } from '@/components/common/Wordmark';
import { COLORS } from '@/constants/theme';

// Bộ phần tử dùng chung cho các màn xác thực, theo FE `features/auth/components/auth-form.tsx`
// (Atelier Paper): nhãn viết hoa giãn chữ, tiêu đề Playfair, liên kết oxblood, đường kẻ "hoặc".

export const AUTH_LABEL_CLASS =
  'font-sans text-label-md uppercase tracking-[0.18em] text-landing-obsidian/80';

/**
 * Khung chung của các màn xác thực: nền paper, logo StAie. ở đầu (như FE dưới `lg`), một cột form
 * canh giữa theo chiều dọc. Bản mobile không có tấm ảnh obsidian của AuthSplitLayout (chỉ có từ `lg`).
 */
export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow px-lg pb-giant pt-lg"
          showsVerticalScrollIndicator={false}
        >
          <Wordmark size="md" variant="dark" />
          <View className="flex-1 justify-center pt-giant">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="mb-xxxl">
      <Text className="font-sans text-label-md uppercase tracking-[0.22em] text-brass-ink">
        {eyebrow}
      </Text>
      <Text
        accessibilityRole="header"
        className="mt-md font-display text-[34px] leading-tight tracking-tight text-landing-obsidian"
      >
        {title}
      </Text>
      {children ? <View className="mt-md">{children}</View> : null}
    </View>
  );
}

/** Một câu muted dưới tiêu đề, có thể kèm liên kết (vd. "Chưa có tài khoản? Tạo tài khoản"). */
export function AuthLead({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-sans text-body-md leading-relaxed text-landing-muted">{children}</Text>
  );
}

/** Liên kết chữ oxblood đậm. hitSlop nới vùng chạm lên 44px mà không đẩy dòng chữ. */
export function AuthTextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
      onPress={onPress}
      className="active:opacity-60"
    >
      <Text className="font-sans text-body-md font-semibold text-oxblood">{label}</Text>
    </Pressable>
  );
}

/** "Quay lại đăng nhập" ở đầu màn, như FE forgot-password / verify-email. */
export function AuthBackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }}
      onPress={onPress}
      className="mb-xxxl flex-row items-center gap-sm self-start active:opacity-60"
    >
      <ArrowLeft size={16} strokeWidth={1.75} color={COLORS.oxblood} />
      <Text className="font-sans text-label-md uppercase tracking-[0.18em] text-oxblood">
        {label}
      </Text>
    </Pressable>
  );
}

export function AuthDivider() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="my-xxl flex-row items-center gap-lg"
    >
      <View className="h-px flex-1 bg-landing-line" />
      <Text className="font-sans text-label-md uppercase tracking-[0.2em] text-landing-muted">
        hoặc
      </Text>
      <View className="h-px flex-1 bg-landing-line" />
    </View>
  );
}

// Độ mạnh chỉ dựa trên độ dài, khớp quy tắc tối thiểu 8 ký tự của backend (FE register-page).
const STRENGTH_BAR_CLASS: Record<number, string> = {
  1: 'bg-danger',
  2: 'bg-landing-brass',
  3: 'bg-landing-sage-ink',
};

function getStrength(password: string) {
  if (!password) return 0;
  if (password.length < 8) return 1;
  if (password.length < 12) return 2;
  return 3;
}

/** Thước độ dài ba vạch và hai quy tắc backend kiểm tra (design/DESIGN.md › Auth). */
export function PasswordRules({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) {
  const strength = getStrength(password);
  const rules = [
    { label: 'Ít nhất 8 ký tự', isValid: password.length >= 8 },
    {
      label: 'Xác nhận mật khẩu trùng khớp',
      isValid: Boolean(confirmPassword) && password === confirmPassword,
    },
  ];

  return (
    <View className="-mt-xs mb-lg">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row gap-1.5"
      >
        {[1, 2, 3].map((level) => (
          <View
            key={level}
            className={`h-0.5 flex-1 ${strength >= level ? STRENGTH_BAR_CLASS[strength] : 'bg-landing-line'}`}
          />
        ))}
      </View>
      <View className="mt-md gap-1.5">
        {rules.map((rule) => (
          <View
            key={rule.label}
            accessible
            accessibilityLabel={`${rule.label}: ${rule.isValid ? 'đã đạt' : 'chưa đạt'}`}
            className="flex-row items-center gap-sm"
          >
            {rule.isValid ? (
              <Check size={14} strokeWidth={2} color={COLORS.sageInk} />
            ) : (
              <Circle size={14} strokeWidth={1.5} color={COLORS.muted} />
            )}
            <Text
              className={`font-sans text-body-sm ${rule.isValid ? 'text-sage-ink' : 'text-landing-muted'}`}
            >
              {rule.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
