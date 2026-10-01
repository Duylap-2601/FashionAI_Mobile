import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { otpSchema } from '@/features/auth/schemas/auth.schema';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const RESEND_COOLDOWN_SECONDS = 60;

const resendTextStyle = tva({
  base: 'text-body-sm font-semibold',
  variants: {
    cooling: {
      true: 'text-on-surface-variant',
      false: 'text-primary-container',
    },
  },
});

export const VerifyEmailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    const result = otpSchema.safeParse({ otp });
    if (!result.success) {
      setOtpError(result.error.issues[0]?.message ?? 'Mã OTP không hợp lệ');
      return;
    }
    setOtpError('');

    try {
      setIsSubmitting(true);
      await authApi.verifyEmail(email, otp);
      Alert.alert('Xác thực thành công', 'Email của bạn đã được xác thực. Vui lòng đăng nhập.', [
        {
          text: 'Đăng nhập',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      setOtp('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await authApi.resendVerification(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      Alert.alert('Đã gửi lại', 'Vui lòng kiểm tra hộp thư email để lấy mã OTP mới.');
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerClassName="grow justify-center px-xxl py-xxxl">
        <View className="mb-xxxl items-center">
          <Text className="text-xxxl font-extrabold text-on-surface-strong">
            Xác thực email
          </Text>
          <Text className="mt-sm text-center text-body-sm leading-relaxed text-on-surface-variant">
            Mã OTP xác thực đã được gửi tới{'\n'}
            <Text className="font-semibold text-on-surface">{email}</Text>
          </Text>
          <Text className="mt-xs text-center text-body-sm text-on-surface-variant">
            Mã có hiệu lực trong 5 phút.
          </Text>
        </View>

        <View className="mb-xxl">
          <View className="mb-lg">
            <OtpInput value={otp} onChange={setOtp} error={otpError || undefined} />
          </View>

          <Button
            title="Xác thực"
            onPress={handleVerify}
            loading={isSubmitting}
            disabled={isResending}
          />

          <TouchableOpacity
            className="mt-lg min-h-11 items-center justify-center py-sm"
            onPress={handleResend}
            disabled={isSubmitting || isResending || cooldown > 0}
          >
            <Text className={resendTextStyle({ cooling: cooldown > 0 })}>
              {isResending
                ? 'Đang gửi lại...'
                : cooldown > 0
                  ? `Gửi lại mã (${cooldown}s)`
                  : 'Gửi lại mã xác thực'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-sm min-h-11 items-center justify-center py-sm"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-body-sm font-semibold text-on-surface-variant">
              Quay lại Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
