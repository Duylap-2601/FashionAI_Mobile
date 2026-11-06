import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Mail } from 'lucide-react-native';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { otpSchema } from '@/features/auth/schemas/auth.schema';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { COLORS } from '@/constants/theme';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import {
  AUTH_LABEL_CLASS,
  AuthBackLink,
  AuthHeading,
  AuthLead,
  AuthScreen,
} from '@/features/auth/components/auth-form';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const RESEND_COOLDOWN_SECONDS = 60;

// Cỡ chữ tuyệt đối vì tailwind-merge trong tva coi token `text-label-*` là màu chữ.
const resendTextStyle = tva({
  base: 'font-sans text-[11px] font-semibold uppercase tracking-[0.18em]',
  variants: {
    cooling: {
      true: 'text-landing-muted',
      false: 'text-oxblood',
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
      <AuthScreen>
        <AuthBackLink label="Quay lại đăng nhập" onPress={() => navigation.navigate('Login')} />

        <AuthHeading eyebrow="Xác thực tài khoản" title="Xác thực email">
          <AuthLead>
            Nhập mã OTP 4 chữ số đã được gửi tới email của bạn để kích hoạt tài khoản.
          </AuthLead>
        </AuthHeading>

        <View className="mb-xxl flex-row items-center gap-md rounded-subtle border border-landing-line bg-landing-ivory px-md py-md">
          <Text className={AUTH_LABEL_CLASS}>Email</Text>
          <Text
            numberOfLines={1}
            className="flex-1 font-sans text-body-md font-medium text-landing-obsidian"
          >
            {email}
          </Text>
        </View>

        <OtpInput value={otp} onChange={setOtp} error={otpError || undefined} />
        <Text className="mb-xxl mt-md text-center font-sans text-body-sm text-landing-muted">
          Mã OTP có hiệu lực trong <Text className="font-mono">5</Text> phút
        </Text>

        <Button
          size="lg"
          title="Xác thực tài khoản"
          loadingTitle="Đang xác thực"
          onPress={handleVerify}
          loading={isSubmitting}
          disabled={isResending}
        />

        <View className="mt-xxl items-center">
          <Text className="font-sans text-body-sm text-landing-muted">Chưa nhận được mã?</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting || isResending || cooldown > 0 }}
            className="min-h-11 items-center justify-center px-md"
            onPress={handleResend}
            disabled={isSubmitting || isResending || cooldown > 0}
          >
            <Text className={resendTextStyle({ cooling: cooldown > 0 })}>
              {isResending ? (
                'Đang gửi lại'
              ) : cooldown > 0 ? (
                <>
                  Gửi lại sau <Text className="font-mono">{cooldown}s</Text>
                </>
              ) : (
                'Gửi lại mã OTP'
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </AuthScreen>

      {/* Modal xác thực thành công: tự động chuyển qua Đăng nhập sau 5s */}
      <FeedbackModal
        visible={showSuccessModal}
        type="success"
        title="Xác thực email thành công"
        message="Tài khoản của bạn đã được kích hoạt và sẵn sàng để đăng nhập."
        autoCloseSeconds={5}
        onAutoClose={navigateToLogin}
        countdownPrefix="Tự động chuyển đến trang đăng nhập sau"
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
        customIcon={<Mail size={28} strokeWidth={1.5} color={COLORS.brassInk} />}
        title="Đã gửi mã OTP mới"
        message={`Mã OTP mới đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư của bạn.`}
        primaryButtonText="Đã hiểu"
        onPrimaryPress={() => setShowResendSuccessModal(false)}
        onClose={() => setShowResendSuccessModal(false)}
        dismissible={true}
      />
    </>
  );
};
