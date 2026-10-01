import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen: React.FC<Props> = ({ navigation, route }) => {
  const [token, setToken] = useState(route.params?.token || '');
  const [tokenError, setTokenError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!token.trim()) {
      setTokenError('Vui lòng nhập mã xác thực từ email');
      return;
    }
    setTokenError('');

    try {
      setIsSubmitting(true);
      await authApi.verifyEmail(token.trim());
      Alert.alert('Xác thực thành công', 'Email của bạn đã được xác thực.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await authApi.resendVerification();
      Alert.alert('Đã gửi lại', 'Vui lòng kiểm tra hộp thư email để lấy mã xác thực mới.');
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Không thể gửi lại email xác thực.');
    } finally {
      setIsResending(false);
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
            Xác thực email
          </Text>
          <Text className="mt-sm text-center text-body-sm leading-5 text-on-surface-variant">
            Nhập mã xác thực đã được gửi tới email của bạn để hoàn tất đăng ký.
          </Text>
        </View>

        <View className="mb-xxl">
          <Input
            label="Mã xác thực"
            placeholder="Dán mã xác thực từ email"
            value={token}
            onChangeText={setToken}
            error={tokenError || undefined}
          />

          <Button
            title="Xác thực"
            onPress={handleVerify}
            loading={isSubmitting}
            disabled={isResending}
          />

          <TouchableOpacity
            className="mt-lg min-h-11 items-center justify-center py-sm"
            onPress={handleResend}
            disabled={isSubmitting || isResending}
          >
            {isResending ? (
              <Text className="text-body-sm font-semibold text-primary-container">
                Đang gửi lại...
              </Text>
            ) : (
              <Text className="text-body-sm font-semibold text-primary-container">
                Gửi lại mã xác thực
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-sm min-h-11 items-center justify-center py-sm"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-body-sm font-semibold text-secondary">
              Quay lại Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
