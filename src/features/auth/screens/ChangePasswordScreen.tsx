import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  changePasswordSchema,
  ChangePasswordFormValues,
} from '@/features/auth/schemas/auth.schema';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
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
      Alert.alert('Đã đổi mật khẩu', 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.');
    } catch (err: any) {
      Alert.alert('Chưa đổi được mật khẩu', err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-landing-paper">
      <AppHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="grow px-lg pb-giant pt-lg"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => navigation.goBack()} />

          <View className="mt-4 gap-2 border-b border-landing-line pb-5">
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
              Bảo mật
            </Text>
            <Text
              accessibilityRole="header"
              className="font-display text-headline-lg text-landing-obsidian"
            >
              Đổi mật khẩu
            </Text>
            <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
              Dùng mật khẩu bạn chưa dùng ở nơi khác.
            </Text>
          </View>

          {/* Trường mật khẩu dùng Input chung (48px, nền ivory, viền hairline, nút hiện/ẩn) như hộp thoại đổi mật khẩu của FE. */}
          <View className="mt-xxl">
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Mật khẩu hiện tại"
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
                  helperText="Ít nhất 8 ký tự."
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
                  label="Nhập lại mật khẩu mới"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmNewPassword?.message}
                />
              )}
            />

            <Button
              className="mt-md"
              size="lg"
              title="Đổi mật khẩu"
              loadingTitle="Đang lưu"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
