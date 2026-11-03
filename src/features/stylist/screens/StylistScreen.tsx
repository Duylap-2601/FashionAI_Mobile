import React, { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AlertCircle,
  Camera,
  Check,
  History,
  Plus,
  ScanFace,
  ShieldCheck,
  Shirt,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react-native';
import { QuotaExhaustedModal } from '@/components/ui/QuotaExhaustedModal';
import { COLORS } from '@/constants/theme';
import { usersApi, type UserQuotaResponse } from '@/features/profile/api/users.api';
import { mainProductImage } from '@/features/products/api/products.api';
import type { IProduct } from '@/features/products/types/product';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { StylistProductPickerModal } from '../components/StylistProductPickerModal';
import {
  STYLIST_BUDGETS,
  STYLIST_GENDERS,
  STYLIST_IMAGE_CONSENT_TEXT,
  STYLIST_OCCASIONS,
  STYLIST_STYLES,
} from '../constants/stylist-options';
import { useAnalyzeStylist, useStylistHistory } from '../hooks/useStylist';
import {
  stylistFormSchema,
  type StylistFormValues,
} from '../schemas/stylist.schema';
import type {
  IStylistImageFile,
  StylistGenderPreference,
} from '../types/stylist';
import { toStylistImageFile } from '../utils/stylist-image';

const labelClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink';
const outlineButtonClass =
  'h-10 flex-row items-center justify-center gap-1.5 rounded-subtle border border-landing-line px-3.5 active:bg-ivory';
const outlineButtonTextClass =
  'font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-landing-obsidian';

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
      onPress={onPress}
      className={`h-10 items-center justify-center rounded-subtle border px-3.5 ${
        selected
          ? 'border-oxblood bg-oxblood'
          : 'border-landing-line bg-landing-paper/60'
      }`}
    >
      <Text
        className={`font-sans text-body-md ${
          selected ? 'text-landing-paper' : 'text-landing-obsidian/80'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OptionGroup({
  index,
  label,
  children,
}: {
  index: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-sm">
      <View className="flex-row items-baseline gap-3">
        <Text className="font-mono text-[11px] tracking-[0.12em] text-landing-muted">
          {index}
        </Text>
        <Text className={labelClass}>{label}</Text>
      </View>
      {children}
    </View>
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

interface ISelectedProduct {
  id: string;
  name: string;
  imageUrl?: string;
}

export function StylistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const analyzeMutation = useAnalyzeStylist();
  const { data: historyData } = useStylistHistory();
  const { data: quota } = useQuery<UserQuotaResponse>({
    queryKey: ['quota', 'STYLIST'],
    queryFn: ({ signal }) => usersApi.getQuota('STYLIST', { signal }),
    staleTime: 30000,
  });

  const [humanImage, setHumanImage] = useState<IStylistImageFile | null>(null);
  const [imageConsent, setImageConsent] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ISelectedProduct | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCustomOccasion, setIsCustomOccasion] = useState(false);
  const [isCustomStyle, setIsCustomStyle] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StylistFormValues>({
    resolver: zodResolver(stylistFormSchema),
    defaultValues: {
      occasion: 'Đi làm',
      stylePreference: '',
      budget: '',
      genderPreference: '',
    },
  });

  const occasion = useWatch({ control, name: 'occasion' }) ?? '';
  const stylePreference = useWatch({ control, name: 'stylePreference' }) ?? '';
  const budget = useWatch({ control, name: 'budget' }) ?? '';
  const genderPreference = useWatch({ control, name: 'genderPreference' }) ?? '';

  const historyTotal = historyData?.pages[0]?.meta.total ?? 0;
  const hasQuota =
    !quota || quota.unlimited || quota.remaining === null || quota.remaining > 0;
  const quotaLabel = !quota
    ? 'Đang tải lượt…'
    : quota.unlimited || quota.limit === null
      ? 'Không giới hạn lượt'
      : `Còn ${Math.max(quota.limit - quota.used, 0)}/${quota.limit} lượt hôm nay`;

  const applyAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const fileResult = toStylistImageFile(asset);
    if ('error' in fileResult) {
      setHumanImage(null);
      setImageError(fileResult.error);
      return;
    }

    analyzeMutation.reset();
    setHumanImage(fileResult.file);
    setImageConsent(false);
    setShowConsentError(false);
    setImageError(null);
  };

  const pickFromLibrary = async () => {
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

    applyAsset(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Cần quyền dùng camera',
        'Hãy cho phép FashionAI dùng camera để chụp ảnh phân tích.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    applyAsset(result.assets[0]);
  };

  const removeImage = () => {
    setHumanImage(null);
    setImageConsent(false);
    setShowConsentError(false);
    setImageError(null);
  };

  const handleSelectProduct = (product: IProduct) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      imageUrl: mainProductImage(product) ?? product.garmentUrl ?? undefined,
    });
  };

  const toggleCustomStyle = () => {
    setIsCustomStyle((current) => !current);
    setValue('stylePreference', '');
  };

  const submit = async (values: StylistFormValues) => {
    setFormError(null);
    if (humanImage && !imageConsent) {
      setShowConsentError(true);
      return;
    }
    if (
      !humanImage &&
      !selectedProduct &&
      !values.occasion.trim() &&
      !values.stylePreference.trim()
    ) {
      setFormError('Vui lòng chọn ảnh, sản phẩm hoặc dịp mặc để AI tư vấn.');
      return;
    }
    if (!hasQuota) {
      setShowQuotaModal(true);
      return;
    }

    setShowConsentError(false);
    try {
      const result = await analyzeMutation.mutateAsync({
        humanImage: humanImage ?? undefined,
        imageConsent: humanImage ? imageConsent : undefined,
        productId: selectedProduct?.id,
        occasion: values.occasion || undefined,
        stylePreference: values.stylePreference || undefined,
        budget: values.budget || undefined,
        genderPreference: values.genderPreference || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['quota', 'STYLIST'] });
      navigation.navigate('StylistResult', { resultId: result.id });
    } catch (err: any) {
      if (
        err?.statusCode === 429 ||
        err?.code === 'QUOTA_EXCEEDED' ||
        err?.message?.includes('hết lượt')
      ) {
        setShowQuotaModal(true);
      }
    }
  };

  const isPending = analyzeMutation.isPending;
  const consentInvalid = showConsentError && !imageConsent;

  return (
    <>
      <ScrollView
        className="flex-1 bg-landing-paper"
        contentContainerClassName="gap-xl px-lg pb-giant pt-lg"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-2 gap-3 border-b border-landing-line pb-6">
          <View className="flex-row items-center gap-2">
            <Sparkles size={14} strokeWidth={1.75} color={COLORS.brassInk} />
            <Text className={labelClass}>AI Stylist</Text>
          </View>
          <Text
            accessibilityRole="header"
            className="font-display text-headline-lg text-landing-obsidian"
          >
            Phối đồ cùng AI
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-landing-muted">
            Chọn dịp mặc, nhận bộ phối từ sản phẩm của cửa hàng.
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <View
              className={`h-10 flex-row items-center gap-2 rounded-subtle border px-3 ${
                hasQuota ? 'border-landing-line' : 'border-danger/40'
              }`}
            >
              <View
                className={`h-1.5 w-1.5 rounded-full ${
                  hasQuota ? 'bg-sage-ink' : 'bg-danger'
                }`}
              />
              <Text
                className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
                  hasQuota ? 'text-landing-obsidian/80' : 'text-danger'
                }`}
              >
                {quotaLabel}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem lịch sử tư vấn"
              onPress={() => navigation.navigate('StylistHistory')}
              className="h-10 flex-row items-center gap-2 rounded-subtle border border-landing-obsidian/70 px-3 active:bg-ivory"
            >
              <History size={14} strokeWidth={1.75} color={COLORS.obsidian} />
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
                Lịch sử
              </Text>
              <Text className="font-mono text-[11px] text-landing-muted">
                {historyTotal}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Form panel */}
        <View className="gap-xl rounded-subtle border border-landing-line bg-ivory p-lg">
          {/* Ảnh */}
          <View className="flex-row items-start gap-lg">
            <View
              className={`h-28 w-20 shrink-0 overflow-hidden rounded-subtle ${
                humanImage
                  ? 'border border-landing-line'
                  : 'border border-dashed border-brass/70 bg-landing-paper'
              }`}
            >
              {humanImage ? (
                <>
                  <Image
                    source={{ uri: humanImage.uri }}
                    contentFit="cover"
                    style={StyleSheet.absoluteFill}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Xóa ảnh"
                    disabled={isPending}
                    hitSlop={6}
                    className="absolute right-1.5 top-1.5 h-8 w-8 items-center justify-center rounded-subtle bg-landing-obsidian/70 active:bg-landing-obsidian"
                    onPress={removeImage}
                  >
                    <X size={14} strokeWidth={1.75} color={COLORS.paper} />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải ảnh lên"
                  className="flex-1 items-center justify-center active:opacity-70"
                  onPress={() => void pickFromLibrary()}
                >
                  <ScanFace size={28} strokeWidth={1.25} color={COLORS.oxblood} />
                </Pressable>
              )}
            </View>

            <View className="flex-1 gap-1">
              <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-obsidian">
                Ảnh của bạn
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                Tùy chọn, giúp AI đọc dáng và màu da
              </Text>

              {!humanImage ? (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending}
                    className={outlineButtonClass}
                    onPress={() => void pickFromLibrary()}
                  >
                    <UploadCloud size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                    <Text className={outlineButtonTextClass}>Tải lên</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending}
                    className={outlineButtonClass}
                    onPress={() => void takePhoto()}
                  >
                    <Camera size={14} strokeWidth={1.75} color={COLORS.obsidian} />
                    <Text className={outlineButtonTextClass}>Chụp</Text>
                  </Pressable>
                </View>
              ) : null}

              <View className="mt-2 flex-row items-center gap-1.5">
                <ShieldCheck size={13} strokeWidth={1.75} color={COLORS.sageInk} />
                <Text className="font-sans text-[11px] text-landing-muted">
                  Không lưu ảnh
                </Text>
              </View>
            </View>
          </View>

          {imageError ? (
            <Text accessibilityRole="alert" className="font-sans text-body-sm text-danger">
              {imageError}
            </Text>
          ) : null}

          {humanImage ? (
            <View className="gap-1">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: imageConsent }}
                onPress={() => {
                  setImageConsent((current) => !current);
                  setShowConsentError(false);
                }}
                className={`flex-row items-start gap-3 border-l-2 bg-landing-paper/60 px-4 py-3 ${
                  consentInvalid ? 'border-danger' : 'border-brass'
                }`}
              >
                <View
                  className={`mt-0.5 h-4 w-4 items-center justify-center rounded-subtle border ${
                    imageConsent
                      ? 'border-oxblood bg-oxblood'
                      : 'border-landing-obsidian/40'
                  }`}
                >
                  {imageConsent ? (
                    <Check size={11} strokeWidth={2.5} color={COLORS.paper} />
                  ) : null}
                </View>
                <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-obsidian/80">
                  {STYLIST_IMAGE_CONSENT_TEXT}
                </Text>
              </Pressable>
              {consentInvalid ? (
                <Text className="font-sans text-body-sm text-danger">
                  Vui lòng đồng ý để AI dùng ảnh phân tích.
                </Text>
              ) : null}
            </View>
          ) : null}

          <OptionGroup index="01" label="Dịp mặc">
            <View className="flex-row flex-wrap gap-2">
              {STYLIST_OCCASIONS.map((value) => (
                <OptionChip
                  key={value}
                  label={value}
                  selected={!isCustomOccasion && occasion === value}
                  onPress={() => {
                    setIsCustomOccasion(false);
                    setValue('occasion', value, { shouldValidate: true });
                  }}
                />
              ))}
              <OptionChip
                label="Khác…"
                selected={isCustomOccasion}
                onPress={() => {
                  setIsCustomOccasion(true);
                  setValue('occasion', '', { shouldValidate: true });
                }}
              />
            </View>
            {isCustomOccasion ? (
              <Controller
                control={control}
                name="occasion"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    autoFocus
                    editable={!isPending}
                    placeholder="VD: Hẹn hò, Du lịch biển, Tiệc sinh nhật"
                    placeholderTextColor={COLORS.muted}
                    className="mt-2 h-11 rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 font-sans text-body-md text-landing-obsidian"
                  />
                )}
              />
            ) : null}
            {errors.occasion?.message ? (
              <Text className="font-sans text-body-sm text-danger">
                {errors.occasion.message}
              </Text>
            ) : null}
          </OptionGroup>

          <OptionGroup index="02" label="Phong cách">
            <View className="flex-row flex-wrap gap-2">
              {STYLIST_STYLES.map((value) => (
                <OptionChip
                  key={value}
                  label={value}
                  selected={!isCustomStyle && stylePreference === value}
                  onPress={() => {
                    setIsCustomStyle(false);
                    setValue('stylePreference', stylePreference === value ? '' : value, {
                      shouldValidate: true,
                    });
                  }}
                />
              ))}
              <OptionChip
                label="Khác…"
                selected={isCustomStyle}
                onPress={toggleCustomStyle}
              />
            </View>
            {isCustomStyle ? (
              <Controller
                control={control}
                name="stylePreference"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    autoFocus
                    editable={!isPending}
                    placeholder="VD: Vintage, Cổ điển, Nữ tính"
                    placeholderTextColor={COLORS.muted}
                    className="mt-2 h-11 rounded-subtle border border-landing-line bg-landing-paper/60 px-3.5 font-sans text-body-md text-landing-obsidian"
                  />
                )}
              />
            ) : null}
            {errors.stylePreference?.message ? (
              <Text className="font-sans text-body-sm text-danger">
                {errors.stylePreference.message}
              </Text>
            ) : null}
          </OptionGroup>

          <OptionGroup index="03" label="Ngân sách mỗi bộ">
            <View className="flex-row flex-wrap gap-2">
              {STYLIST_BUDGETS.map((value) => (
                <OptionChip
                  key={value}
                  label={value}
                  selected={budget === value}
                  onPress={() =>
                    setValue('budget', budget === value ? '' : value, {
                      shouldValidate: true,
                    })
                  }
                />
              ))}
            </View>
          </OptionGroup>

          <OptionGroup index="04" label="Giới tính">
            <View className="flex-row flex-wrap gap-2">
              {STYLIST_GENDERS.map((option) => (
                <OptionChip
                  key={option.value}
                  label={option.label}
                  selected={genderPreference === option.value}
                  onPress={() =>
                    setValue(
                      'genderPreference',
                      genderPreference === option.value
                        ? ''
                        : (option.value as StylistGenderPreference),
                      { shouldValidate: true },
                    )
                  }
                />
              ))}
            </View>
          </OptionGroup>

          <OptionGroup index="05" label="Món muốn phối cùng">
            {selectedProduct ? (
              <View className="flex-row items-center gap-3 self-start rounded-subtle border border-oxblood/40 bg-landing-paper/60 py-1.5 pl-1.5 pr-3">
                <View className="h-12 w-10 overflow-hidden rounded-subtle bg-landing-paper">
                  {selectedProduct.imageUrl ? (
                    <Image
                      source={{ uri: selectedProduct.imageUrl }}
                      contentFit="contain"
                      style={StyleSheet.absoluteFill}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Shirt size={18} strokeWidth={1.5} color={COLORS.muted} />
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  className="max-w-40 font-display text-[15px] text-landing-obsidian"
                >
                  {selectedProduct.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đổi sản phẩm"
                  className="min-h-11 justify-center px-2 active:opacity-70"
                  onPress={() => setShowProductPicker(true)}
                >
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">
                    Đổi
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Bỏ chọn sản phẩm"
                  className="h-11 w-11 items-center justify-center active:opacity-60"
                  onPress={() => setSelectedProduct(null)}
                >
                  <X size={14} strokeWidth={1.75} color={COLORS.muted} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="h-10 flex-row items-center justify-center gap-1.5 self-start rounded-subtle border border-dashed border-brass/70 px-3.5 active:bg-landing-paper"
                onPress={() => setShowProductPicker(true)}
              >
                <Plus size={16} strokeWidth={1.75} color={COLORS.obsidian} />
                <Text className="font-sans text-body-md text-landing-obsidian/80">
                  Chọn từ cửa hàng
                </Text>
              </Pressable>
            )}
          </OptionGroup>

          <View className="h-px bg-landing-line" />

          {formError ? (
            <View className="flex-row items-start gap-3 border-l-2 border-danger bg-landing-paper/60 px-4 py-3">
              <AlertCircle size={16} strokeWidth={1.75} color={COLORS.danger} />
              <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-obsidian">
                {formError}
              </Text>
            </View>
          ) : null}

          {isPending ? (
            <View className="gap-1 border-l-2 border-brass bg-landing-paper/60 px-4 py-3">
              <Text className="font-sans text-body-sm font-semibold text-oxblood">
                {analyzeMutation.uploadProgress > 0 &&
                analyzeMutation.uploadProgress < 100
                  ? `Đang tải ảnh lên ${analyzeMutation.uploadProgress}%`
                  : 'AI đang phân tích phong cách của bạn…'}
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-landing-muted">
                Phân tích có thể mất đến 90 giây. Vui lòng giữ ứng dụng mở.
              </Text>
              <Pressable
                accessibilityRole="button"
                className="min-h-11 self-start justify-center active:opacity-70"
                onPress={analyzeMutation.cancel}
              >
                <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-oxblood">
                  Hủy chờ
                </Text>
              </Pressable>
            </View>
          ) : null}

          {analyzeMutation.error ? (
            <View className="flex-row items-start gap-3 border-l-2 border-danger bg-landing-paper/60 px-4 py-3">
              <AlertCircle size={16} strokeWidth={1.75} color={COLORS.danger} />
              <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-obsidian">
                {getErrorMessage(analyzeMutation.error)}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            className={`h-12 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood ${
              isPending ? 'opacity-70' : 'active:bg-landing-obsidian'
            }`}
            onPress={handleSubmit(submit)}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.paper} />
            ) : (
              <Sparkles size={16} strokeWidth={1.75} color={COLORS.paper} />
            )}
            <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.18em] text-landing-paper">
              {isPending ? 'Đang phối đồ…' : 'Gợi ý bộ phối'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {showProductPicker ? (
        <StylistProductPickerModal
          visible
          currentProductId={selectedProduct?.id}
          onClose={() => setShowProductPicker(false)}
          onSelect={handleSelectProduct}
          onClear={() => setSelectedProduct(null)}
        />
      ) : null}

      <QuotaExhaustedModal
        visible={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        actionName="AI Stylist"
      />
    </>
  );
}

export default StylistScreen;
