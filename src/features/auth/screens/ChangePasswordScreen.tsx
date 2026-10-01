import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  changePasswordSchema,
  ChangePasswordFormValues,
} from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen: React.FC<Props> = () => {
  const { changePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      setIsSubmitting(true);
      await changePassword(values.currentPassword, values.newPassword);
      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.');
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
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
          <Text className="text-xxxl font-extrabold text-on-surface-strong">Đổi mật khẩu</Text>
          <Text className="mt-sm text-center text-body-sm leading-5 text-on-surface-variant">
            Nhập mật khẩu hiện tại và mật khẩu mới cho tài khoản của bạn.
          </Text>
        </View>

        <View className="mb-xxl">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Mật khẩu hiện tại"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Mật khẩu mới"
                placeholder="Ít nhất 8 ký tự"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmNewPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Xác nhận mật khẩu mới"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmNewPassword?.message}
              />
            )}
          />

          <Button
            title="Lưu mật khẩu mới"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
