import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppHeader } from '@/components/common/AppHeader';
import { BackButton } from '@/components/common/BackButton';
import { COLORS } from '@/constants/theme';
import {
  changePasswordSchema,
  ChangePasswordFormValues,
} from '@/features/auth/schemas/auth.schema';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

const fieldClass =
  'h-11 rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 font-sans text-body-md text-landing-obsidian';

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
      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.');
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
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

          <View className="mt-2 gap-2 border-b border-landing-line pb-5">
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
              Tài khoản
            </Text>
            <Text
              accessibilityRole="header"
              className="font-display text-headline-lg text-landing-obsidian"
            >
              Đổi mật khẩu
            </Text>
            <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
              Nhập mật khẩu hiện tại và mật khẩu mới cho tài khoản của bạn.
            </Text>
          </View>

          <View className="mt-lg gap-5 rounded-subtle border border-landing-line bg-ivory p-lg">
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <View className="gap-2">
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-obsidian">
                    Mật khẩu hiện tại
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.muted}
                    className={`${fieldClass} ${errors.currentPassword ? 'border-danger' : ''}`}
                  />
                  {errors.currentPassword?.message ? (
                    <Text className="font-sans text-body-sm text-danger">
                      {errors.currentPassword.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <View className="gap-2">
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-obsidian">
                    Mật khẩu mới
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    placeholder="Ít nhất 8 ký tự"
                    placeholderTextColor={COLORS.muted}
                    className={`${fieldClass} ${errors.newPassword ? 'border-danger' : ''}`}
                  />
                  {errors.newPassword?.message ? (
                    <Text className="font-sans text-body-sm text-danger">
                      {errors.newPassword.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmNewPassword"
              render={({ field: { value, onChange, onBlur } }) => (
                <View className="gap-2">
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-obsidian">
                    Xác nhận mật khẩu mới
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.muted}
                    className={`${fieldClass} ${errors.confirmNewPassword ? 'border-danger' : ''}`}
                  />
                  {errors.confirmNewPassword?.message ? (
                    <Text className="font-sans text-body-sm text-danger">
                      {errors.confirmNewPassword.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              className={`h-12 flex-row items-center justify-center rounded-subtle bg-oxblood ${
                isSubmitting ? 'opacity-70' : 'active:bg-landing-obsidian'
              }`}
            >
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                {isSubmitting ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
