import React, { useState } from "react";
import { View, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react-native";

import { AuthStackParamList } from "@/navigation/types";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  registerSchema,
  RegisterFormValues,
} from "@/features/auth/schemas/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/theme";
import {
  AuthHeading,
  AuthLead,
  AuthScreen,
  AuthTextLink,
  PasswordRules,
} from "@/features/auth/components/auth-form";

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

  // Chỉ đọc để vẽ thước độ dài và hai quy tắc mật khẩu, không đổi luồng kiểm tra của form.
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  const onSubmit = async (values: RegisterFormValues) => {
    const email = values.email.trim();
    try {
      setIsSubmitting(true);
      await register({
        name: values.name.trim(),
        email,
        password: values.password,
      });
      navigation.navigate("VerifyEmail", { email });
    } catch (err: any) {
      Alert.alert(
        "Đăng ký thất bại",
        err.message || "Đăng ký tài khoản thất bại. Email có thể đã tồn tại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeading eyebrow="Tài khoản mới" title="Tạo tài khoản">
        <View className="flex-row flex-wrap items-center gap-xs">
          <AuthLead>Đã có tài khoản?</AuthLead>
          <AuthTextLink label="Đăng nhập" onPress={() => navigation.navigate("Login")} />
        </View>
      </AuthHeading>

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

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Mật khẩu"
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
        size="lg"
        title="Tạo tài khoản"
        loadingTitle="Đang tạo tài khoản"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        rightIcon={<ArrowRight size={16} strokeWidth={1.75} color={COLORS.paper} />}
      />
    </AuthScreen>
  );
};
