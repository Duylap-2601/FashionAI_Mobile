import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import Svg, { Path } from 'react-native-svg';
import { loginSchema, LoginFormValues } from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
          err.message || 'Vui lòng xác thực email trước khi đăng nhập.',
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerClassName="grow justify-center px-xxl py-xxxl">
        <View className="mb-xxxl items-center">
          <Text className="text-display text-on-surface-strong tracking-tight">FashionAI</Text>
          <Text className="mt-sm text-center text-body-sm text-on-surface-variant">
            Đăng nhập để trải nghiệm AI Virtual Try-On
          </Text>
        </View>

        <View className="mb-xxl">
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Email"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <TouchableOpacity
            className="mb-md min-h-11 self-end justify-center"
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-label-lg text-primary-container">Quên mật khẩu?</Text>
          </TouchableOpacity>

<Button
              title="Đăng nhập"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isGoogleSubmitting}
              textClassName="text-primary-foreground"
            />

          <View className="my-xl flex-row items-center">
            <View className="h-px flex-1 bg-surface-line" />
            <Text className="mx-md text-label-md text-outline">HOẶC</Text>
            <View className="h-px flex-1 bg-surface-line" />
          </View>

          <Button
            title="Tiếp tục với Google"
            variant="outline"
            onPress={handleGoogleLogin}
            loading={isGoogleSubmitting}
            disabled={isSubmitting}
            leftIcon={<GoogleLogo size={20} />}
          />
        </View>

        <View className="mt-lg flex-row items-center justify-center">
          <Text className="text-body-sm text-on-surface-variant">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-label-lg text-primary-container">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
