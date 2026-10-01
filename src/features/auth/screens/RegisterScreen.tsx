import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthStackParamList } from "@/navigation/types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  registerSchema,
  RegisterFormValues,
} from "@/features/auth/schemas/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch (err: any) {
      Alert.alert("Đăng ký thất bại", err.message || "Không thể tạo tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerClassName="grow justify-center px-xxl py-xxxl">
        <View className="mb-xxl items-center">
          <Text className="text-xxxl font-extrabold text-on-surface-strong">
            Tạo tài khoản
          </Text>
          <Text className="mt-xs text-center text-body-sm text-on-surface-variant">
            Bắt đầu phong cách mới cùng FashionAI
          </Text>
        </View>

        <View className="mb-xl">
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

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
                placeholder="Ít nhất 6 ký tự"
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
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
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
            title="Đăng ký"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>

        <View className="mt-lg flex-row items-center justify-center">
          <Text className="text-body-sm text-on-surface-variant">
            Đã có tài khoản?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="text-body-sm font-bold text-primary-container">
              Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
