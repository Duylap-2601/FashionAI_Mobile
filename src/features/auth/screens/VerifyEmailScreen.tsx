import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { otpSchema } from '@/features/auth/schemas/auth.schema';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { COLORS } from '@/constants/theme';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const RESEND_COOLDOWN_SECONDS = 60;

const resendTextStyle = tva({
  base: 'text-label-lg',
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

  // Modal feedback states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResendSuccessModal, setShowResendSuccessModal] = useState(false);

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
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
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
      setShowResendSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setIsResending(false);
    }
  };

  const navigateToLogin = () => {
    setShowSuccessModal(false);
    navigation.navigate('Login');
  };

  return (
    <>
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
              <Text className="text-label-lg text-on-surface-variant">
                Quay lại Đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal xác thực thành công — Tự động chuyển qua Đăng nhập sau 5s */}
      <FeedbackModal
        visible={showSuccessModal}
        type="success"
        title="Xác thực thành công!"
        message="Email của bạn đã được xác thực thành công. Tài khoản đã sẵn sàng để đăng nhập."
        autoCloseSeconds={5}
        onAutoClose={navigateToLogin}
        countdownPrefix="Tự động chuyển qua Đăng nhập sau"
        primaryButtonText="Đăng nhập ngay"
        onPrimaryPress={navigateToLogin}
      />

      {/* Modal thông báo lỗi xác thực hoặc gửi lại mã thất bại */}
      <FeedbackModal
        visible={!!errorMessage}
        type="error"
        title="Xác thực thất bại"
        message={errorMessage}
        primaryButtonText="Thử lại"
        onPrimaryPress={() => setErrorMessage('')}
        onClose={() => setErrorMessage('')}
        dismissible={true}
      />

      {/* Modal thông báo đã gửi lại mã OTP thành công */}
      <FeedbackModal
        visible={showResendSuccessModal}
        type="info"
        customIcon={
          <Ionicons
            name="mail-outline"
            size={32}
            color={COLORS.primaryContainer}
          />
        }
        title="Đã gửi lại mã xác thực"
        message={`Mã xác thực mới đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư email của bạn.`}
        primaryButtonText="Đã hiểu"
        onPrimaryPress={() => setShowResendSuccessModal(false)}
        onClose={() => setShowResendSuccessModal(false)}
        dismissible={true}
      />
    </>
  );
};
