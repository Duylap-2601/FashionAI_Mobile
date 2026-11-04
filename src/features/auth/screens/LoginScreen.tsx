import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react-native';
import { AuthStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import Svg, { Path } from 'react-native-svg';
import { loginSchema, LoginFormValues } from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';
import {
  AUTH_LABEL_CLASS,
  AuthDivider,
  AuthHeading,
  AuthLead,
  AuthScreen,
  AuthTextLink,
} from '@/features/auth/components/auth-form';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Logo Google "G" 4 màu chính thức (tài sản thương hiệu Google — giữ nguyên màu gốc).
const GoogleLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </Svg>
);

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const email = values.email.trim();
    try {
      setIsSubmitting(true);
      await login({ email, password: values.password });
    } catch (err: any) {
      if (err.statusCode === 403) {
        Alert.alert(
          'Tài khoản chưa xác thực',
          err.message ||
            'Tài khoản chưa xác thực email. Vui lòng xác thực OTP trước khi đăng nhập.',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Xác thực ngay',
              onPress: () => navigation.navigate('VerifyEmail', { email }),
            },
          ],
        );
      } else {
        Alert.alert('Đăng nhập thất bại', err.message || 'Email hoặc mật khẩu không chính xác');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleSubmitting(true);
      await loginWithGoogle();
    } catch (err: any) {
      Alert.alert('Đăng nhập Google thất bại', err.message || 'Không thể đăng nhập bằng Google');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeading eyebrow="Tài khoản" title="Đăng nhập">
        <View className="flex-row flex-wrap items-center gap-xs">
          <AuthLead>Chưa có tài khoản?</AuthLead>
          <AuthTextLink label="Tạo tài khoản" onPress={() => navigation.navigate('Register')} />
        </View>
      </AuthHeading>

      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Email"
            placeholder="nhap@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      {/* Nhãn mật khẩu kèm "Quên mật khẩu?" bên phải, như AuthField của FE. */}
      <View className="mb-sm mt-sm flex-row items-baseline justify-between gap-md">
        <Text className={AUTH_LABEL_CLASS}>Mật khẩu</Text>
        <AuthTextLink
          label="Quên mật khẩu?"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
      </View>
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            accessibilityLabel="Mật khẩu"
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      <Button
        className="mt-md"
        size="lg"
        title="Đăng nhập"
        loadingTitle="Đang đăng nhập"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isGoogleSubmitting}
        rightIcon={<ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />}
      />

      <AuthDivider />

      <Button
        title="Tiếp tục với Google"
        variant="secondary"
        size="lg"
        onPress={handleGoogleLogin}
        loading={isGoogleSubmitting}
        disabled={isSubmitting}
        leftIcon={<GoogleLogo size={18} />}
        textClassName="text-[14px] font-medium normal-case tracking-normal"
      />
    </AuthScreen>
  );
};
