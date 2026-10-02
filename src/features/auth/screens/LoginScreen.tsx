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
import { Ionicons } from '@expo/vector-icons';
import { loginSchema, LoginFormValues } from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

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
            leftIcon={
              <Ionicons
                name="logo-google"
                size={20}
                className="text-primary-container"
              />
            }
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
