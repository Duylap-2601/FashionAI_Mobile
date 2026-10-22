import React, { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Sparkles, UploadCloud } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { Button } from '@/components/ui/Button';
import { Input, type InputProps } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { QuotaExhaustedModal } from '@/components/ui/QuotaExhaustedModal';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { useAnalyzeStylist } from '../hooks/useStylist';
import {
  stylistFormSchema,
  type StylistFormValues,
} from '../schemas/stylist.schema';
import type {
  IStylistImageFile,
  StylistGenderPreference,
} from '../types/stylist';
import { toStylistImageFile } from '../utils/stylist-image';

type Props = NativeStackScreenProps<RootStackParamList, 'Stylist'>;

const chipStyle = tva({
  base: 'min-h-11 items-center justify-center rounded-full border px-md',
  variants: {
    selected: {
      true: 'border-primary-container bg-primary-container',
      false: 'border-catalog-line bg-surface-lowest',
    },
  },
});

const chipTextStyle = tva({
  base: 'font-sans text-body-sm font-medium',
  variants: {
    selected: {
      true: 'text-on-primary',
      false: 'text-on-surface-variant',
    },
  },
});

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={chipStyle({ selected })}
      onPress={onPress}
    >
      <Text className={chipTextStyle({ selected })}>{label}</Text>
    </Pressable>
  );
}

function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Chưa thể hoàn tất tư vấn. Vui lòng thử lại.';
  }
  if (error.statusCode === 429) {
    return 'Bạn đã dùng hết lượt AI Stylist hiện tại. Vui lòng thử lại sau khi hạn mức được làm mới.';
  }
  if (error.statusCode === 503 || error.code === 'GEMINI_NOT_CONFIGURED') {
    return 'AI Stylist hiện chưa được cấu hình. Vui lòng thử lại sau.';
  }
  if (error.statusCode === 408) {
    return 'Quá trình phân tích mất quá nhiều thời gian. Vui lòng thử lại.';
  }
  if (error.statusCode === 502 || error.code === 'GEMINI_INVALID_RESPONSE') {
    return 'AI chưa tạo được kết quả hợp lệ. Vui lòng thử lại.';
  }
  return error.message;
}

function StylistField({ label, error, className, ...props }: InputProps) {
  return (
    <View>
      <Text className="mb-sm font-sans text-body-sm font-semibold text-on-surface">{label}</Text>
      <Input
        {...props}
        accessibilityLabel={label}
        error={error}
        containerClassName="!mb-0"
        fieldContainerClassName={error ? '!rounded-xl border-danger' : '!rounded-xl border-catalog-line !bg-catalog-muted'}
        className={`font-sans !text-body-sm ${className ?? ''}`}
      />
    </View>
  );
}

const OCCASIONS = ['Đi làm', 'Phỏng vấn', 'Họp quan trọng', 'Sự kiện'];
const GENDERS: { label: string; value: StylistGenderPreference | '' }[] = [
  { label: 'Không chọn', value: '' },
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
];

export function StylistScreen({ navigation }: Props) {
  const analyzeMutation = useAnalyzeStylist();
  const [humanImage, setHumanImage] = useState<IStylistImageFile | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StylistFormValues>({
    resolver: zodResolver(stylistFormSchema),
    defaultValues: {
      garmentDescription: '',
      occasion: 'Đi làm',
      stylePreference: '',
      budget: '',
      genderPreference: '',
    },
  });

  const occasion = useWatch({ control, name: 'occasion' });
  const genderPreference = useWatch({ control, name: 'genderPreference' });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Cần quyền truy cập ảnh',
        'Hãy cho phép FashionAI truy cập thư viện để chọn ảnh phân tích.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      selectionLimit: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    const fileResult = toStylistImageFile(result.assets[0]);
    if ('error' in fileResult) {
      setHumanImage(null);
      setImageError(fileResult.error);
      return;
    }

    analyzeMutation.reset();
    setHumanImage(fileResult.file);
    setImageError(null);
  };

  const submit = async (values: StylistFormValues) => {
    if (!humanImage) {
      setImageError('Vui lòng chọn ảnh để AI Stylist phân tích.');
      return;
    }

    setImageError(null);
    try {
      const result = await analyzeMutation.mutateAsync({
        humanImage,
        garmentDescription: values.garmentDescription,
        occasion: values.occasion || undefined,
        stylePreference: values.stylePreference || undefined,
        budget: values.budget || undefined,
        genderPreference: values.genderPreference || undefined,
      });
      navigation.navigate('StylistResult', { resultId: result.id });
    } catch (err: any) {
      if (err?.statusCode === 429 || err?.code === 'QUOTA_EXCEEDED' || err?.message?.includes('hết lượt')) {
        setShowQuotaModal(true);
      }
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-catalog-muted"
      contentContainerClassName="gap-xxl px-lg pb-xxxl pt-xxl"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center gap-md py-lg">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10">
          <Sparkles size={24} color={COLORS.primaryContainer} />
        </View>
        <Text accessibilityRole="header" className="text-center font-sans text-headline-lg font-bold text-on-surface-strong">AI Stylist</Text>
        <Text className="text-center font-sans text-body-sm leading-relaxed text-catalog-muted-text">
          Chọn một ảnh rõ người và mô tả trang phục bạn đang cân nhắc. AI sẽ phân tích vóc dáng,
          bảng màu và cách phối phù hợp.
        </Text>
        <View className="rounded-full border border-catalog-line bg-surface-lowest px-lg py-sm">
          <Text className="text-center font-sans text-body-sm text-on-surface-variant">Lượt tư vấn theo hạn mức gói của bạn</Text>
        </View>
      </View>

      <Card variant="outlined" className="gap-xxl !rounded-2xl !border-catalog-line !p-xxl">
        <View>
          <Text className="mb-xl font-sans text-headline-sm font-semibold text-primary-container">1. Ảnh của bạn *</Text>
          {humanImage ? (
            <View className="gap-md">
              <View className="aspect-[3/4] w-52 max-w-full self-center overflow-hidden rounded-xl border border-catalog-line bg-catalog-muted">
              {/* expo-image does not consume NativeWind classes; fill the token-sized wrapper. */}
              <Image
                source={{ uri: humanImage.uri }}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
              </View>
              <View className="flex-row flex-wrap gap-sm">
                <Button
                  title="Chọn ảnh khác"
                  variant="outline"
                  size="sm"
                  className="flex-1 !rounded-xl !border-catalog-line"
                  textClassName="font-sans !text-primary-container"
                  disabled={analyzeMutation.isPending}
                  onPress={() => void pickImage()}
                />
                <Button
                  title="Xóa ảnh"
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  disabled={analyzeMutation.isPending}
                  textClassName="font-sans !text-danger"
                  onPress={() => setHumanImage(null)}
                />
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              className="h-64 w-52 max-w-full self-center items-center justify-center gap-md rounded-xl border-2 border-dashed border-outline-variant bg-catalog-muted px-lg active:opacity-70"
              onPress={() => void pickImage()}
            >
              <UploadCloud size={28} color={COLORS.primaryContainer} />
              <Text className="text-center font-sans text-body-sm font-semibold text-primary-container">Chọn ảnh từ thư viện</Text>
              <Text className="text-center font-sans text-body-sm leading-relaxed text-catalog-muted-text">
                JPEG, PNG hoặc WebP · tối đa 10 MB
              </Text>
            </Pressable>
          )}
          {imageError ? (
            <Text accessibilityRole="alert" className="mt-sm font-sans text-body-sm text-danger">
              {imageError}
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="garmentDescription"
          render={({ field: { value, onChange, onBlur } }) => (
            <StylistField
              label="Trang phục cần tư vấn *"
              placeholder="Ví dụ: blazer navy may đo, sơ mi trắng và quần suông"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={value}
              editable={!analyzeMutation.isPending}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.garmentDescription?.message}
              className="min-h-20"
            />
          )}
        />

        <View>
          <Text className="mb-sm font-sans text-body-sm font-semibold text-on-surface">Dịp mặc</Text>
          <View className="flex-row flex-wrap gap-sm">
            {OCCASIONS.map((value) => (
              <OptionChip
                key={value}
                label={value}
                selected={occasion === value}
                onPress={() => setValue('occasion', value, { shouldValidate: true })}
              />
            ))}
          </View>
        </View>

        <Controller
          control={control}
          name="occasion"
          render={({ field: { value, onChange, onBlur } }) => (
            <StylistField
              label="Dịp mặc khác"
              placeholder="Nhập dịp mặc cụ thể nếu cần"
              value={value}
              editable={!analyzeMutation.isPending}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.occasion?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="stylePreference"
          render={({ field: { value, onChange, onBlur } }) => (
            <StylistField
              label="Phong cách yêu thích"
              placeholder="Ví dụ: tối giản, thanh lịch, smart casual"
              value={value}
              editable={!analyzeMutation.isPending}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.stylePreference?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="budget"
          render={({ field: { value, onChange, onBlur } }) => (
            <StylistField
              label="Ngân sách dự kiến"
              placeholder="Ví dụ: dưới 2 triệu đồng"
              value={value}
              editable={!analyzeMutation.isPending}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.budget?.message}
            />
          )}
        />

        <View>
          <Text className="mb-sm font-sans text-body-sm font-semibold text-on-surface">Giới tính ưu tiên tư vấn</Text>
          <View className="flex-row flex-wrap gap-sm">
            {GENDERS.map((option) => (
              <OptionChip
                key={option.value || 'none'}
                label={option.label}
                selected={genderPreference === option.value}
                onPress={() => setValue('genderPreference', option.value)}
              />
            ))}
          </View>
        </View>

        {analyzeMutation.isPending ? (
          <View className="rounded-xl border border-catalog-line bg-catalog-muted p-lg">
            <Text className="font-sans text-headline-sm text-primary-container">
              {analyzeMutation.uploadProgress > 0 && analyzeMutation.uploadProgress < 100
                ? `Đang tải ảnh lên ${analyzeMutation.uploadProgress}%`
                : 'AI đang phân tích phong cách của bạn...'}
            </Text>
            <Text className="mt-sm font-sans text-body-sm leading-relaxed text-on-surface-variant">
              Phân tích chuyên sâu có thể mất đến khoảng 90 giây. Vui lòng giữ ứng dụng mở.
            </Text>
            <Button
              title="Hủy chờ"
              variant="outline"
              size="sm"
              className="mt-md self-start !rounded-xl !border-catalog-line"
              textClassName="font-sans !text-primary-container"
              onPress={analyzeMutation.cancel}
            />
          </View>
        ) : null}

        {analyzeMutation.error ? (
          <Text accessibilityRole="alert" className="rounded-xl border border-catalog-line bg-catalog-muted p-md font-sans text-body-sm text-danger">
            {getErrorMessage(analyzeMutation.error)}
          </Text>
        ) : null}

        <Button
          title="Phân tích phong cách"
          size="lg"
          loading={analyzeMutation.isPending}
          className="!rounded-xl"
          textClassName="font-sans !text-body-md !text-on-primary"
          onPress={handleSubmit(submit)}
        />
      </Card>
      <Button
        title="Xem lịch sử tư vấn"
        variant="outline"
        className="!rounded-xl !border-catalog-line bg-surface-lowest"
        textClassName="font-sans !text-body-sm !text-primary-container"
        onPress={() => navigation.navigate('StylistHistory')}
      />

      <QuotaExhaustedModal
        visible={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        actionName="AI Stylist"
      />
    </ScrollView>
  );
}
