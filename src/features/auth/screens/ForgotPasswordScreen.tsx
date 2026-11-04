import React, { useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react-native';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import {
  forgotPasswordSchema,
  ForgotPasswordFormValues,
} from '@/features/auth/schemas/auth.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';
import {
  AuthBackLink,
  AuthHeading,
  AuthLead,
  AuthScreen,
} from '@/features/auth/components/auth-form';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    const email = values.email.trim();
    try {
      setIsSubmitting(true);
      await authApi.forgotPassword(email);
      // Backend không cho biết email có tồn tại hay không, nên câu chữ không khẳng định đã gửi.
      Alert.alert(
        'Kiểm tra email của bạn',
        `Nếu ${email} đã đăng ký tài khoản, link đặt lại mật khẩu đã được gửi tới hộp thư. Link có hiệu lực trong 1 giờ.`,
        [
          {
            text: 'Về đăng nhập',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Chưa gửi được yêu cầu', err.message || 'Không thể gửi email đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <AuthBackLink label="Quay lại đăng nhập" onPress={() => navigation.navigate('Login')} />

      <AuthHeading eyebrow="Khôi phục tài khoản" title="Quên mật khẩu?">
        <AuthLead>
          Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu.
        </AuthLead>
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

      <Button
        className="mt-md"
        size="lg"
        title="Gửi link đặt lại"
        loadingTitle="Đang gửi"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        rightIcon={<ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />}
      />
    </AuthScreen>
  );
};
