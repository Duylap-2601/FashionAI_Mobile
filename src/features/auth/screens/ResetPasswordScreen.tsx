import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import {
  resetPasswordSchema,
  ResetPasswordFormValues,
} from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const [token, setToken] = useState(route.params?.token || '');
  const [tokenError, setTokenError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token.trim()) {
      setTokenError('Vui lòng nhập mã token đặt lại mật khẩu');
      return;
    }
    setTokenError('');

    try {
      setIsSubmitting(true);
      await authApi.resetPassword(token.trim(), values.password);
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được cập nhật thành công!', [
        {
          text: 'Đăng nhập',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
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
            Đặt lại mật khẩu
          </Text>
          <Text className="mt-sm text-center text-body-sm leading-5 text-on-surface-variant">
            Nhập mã xác thực và mật khẩu mới cho tài khoản của bạn.
          </Text>
        </View>

        <View className="mb-xxl">
          <Input
            label="Mã xác thực (Token)"
            placeholder="Dán mã token từ email"
            value={token}
            onChangeText={setToken}
            error={tokenError || undefined}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Mật khẩu mới"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Xác nhận mật khẩu mới"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Lưu mật khẩu mới"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />

          <TouchableOpacity
            className="mt-lg min-h-11 items-center justify-center py-sm"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-label-lg text-on-surface-variant">
              Quay lại Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
