import React, { useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react-native';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import {
  resetPasswordSchema,
  ResetPasswordFormValues,
} from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';
import {
  AuthBackLink,
  AuthHeading,
  AuthLead,
  AuthScreen,
  PasswordRules,
} from '@/features/auth/components/auth-form';

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

  // Chỉ đọc để vẽ thước độ dài và hai quy tắc mật khẩu, không đổi luồng kiểm tra của form.
  const password = useWatch({ control, name: 'password' }) ?? '';
  const confirmPassword = useWatch({ control, name: 'confirmPassword' }) ?? '';

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token.trim()) {
      setTokenError('Vui lòng nhập mã đặt lại mật khẩu');
      return;
    }
    setTokenError('');

    try {
      setIsSubmitting(true);
      await authApi.resetPassword(token.trim(), values.password);
      Alert.alert('Đã đặt mật khẩu mới', 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.', [
        {
          text: 'Đăng nhập',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Chưa đặt lại được mật khẩu', err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <AuthBackLink label="Quay lại đăng nhập" onPress={() => navigation.navigate('Login')} />

      <AuthHeading eyebrow="Khôi phục tài khoản" title="Đặt mật khẩu mới">
        <AuthLead>Nhập mã đặt lại trong email và mật khẩu mới cho tài khoản của bạn.</AuthLead>
      </AuthHeading>

      <Input
        label="Mã đặt lại mật khẩu"
        placeholder="Dán mã từ email"
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
            placeholder="Ít nhất 8 ký tự"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <PasswordRules password={password} confirmPassword={confirmPassword} />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        className="mt-md"
        size="lg"
        title="Cập nhật mật khẩu"
        loadingTitle="Đang cập nhật"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        rightIcon={<ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />}
      />
    </AuthScreen>
  );
};
