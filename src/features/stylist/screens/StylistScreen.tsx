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
  Briefcase,
  Camera,
  Check,
  History,
  Palette,
  Plus,
  ScanFace,
  ShieldCheck,
  Shirt,
  Sparkles,
  UploadCloud,
  UserRound,
  Wallet,
  X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
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

function OptionGroup({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-sm">
      <View className="flex-row items-center gap-1.5">
        <Icon size={14} color={COLORS.catalogMutedText} />
        <Text className="font-sans text-body-sm font-semibold text-catalog-muted-text">
          {label}
        </Text>
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

  return (
    <>
      <ScrollView
        className="flex-1 bg-catalog-muted"
        contentContainerClassName="gap-lg px-lg pb-giant pt-lg"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color={COLORS.primaryContainer} />
            <Text className="font-sans text-body-sm font-semibold text-primary-container">
              AI Stylist
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            className="mt-1 font-sans text-headline-lg text-on-surface-strong"
          >
            Phối đồ cùng AI
          </Text>
          <Text className="font-sans text-body-md leading-relaxed text-catalog-muted-text">
            Chọn dịp mặc, nhận bộ phối từ sản phẩm của cửa hàng.
          </Text>

          <View className="mt-2 flex-row flex-wrap items-center gap-sm">
            <View className="h-9 flex-row items-center gap-1.5 rounded-full border border-catalog-line bg-surface-lowest px-md">
              <View
                className={`h-1.5 w-1.5 rounded-full ${hasQuota ? 'bg-success' : 'bg-danger'}`}
              />
              <Text
                className={`font-sans text-body-sm font-medium ${
                  hasQuota ? 'text-on-surface-variant' : 'text-danger'
                }`}
              >
                {quotaLabel}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem lịch sử tư vấn"
              hitSlop={8}
              className="h-9 flex-row items-center gap-1.5 rounded-full border border-catalog-line bg-surface-lowest px-md active:bg-catalog-muted"
              onPress={() => navigation.navigate('StylistHistory')}
            >
              <History size={13} color={COLORS.onSurfaceVariant} />
              <Text className="font-sans text-body-sm font-medium text-on-surface-variant">
                Lịch sử
              </Text>
              <Text className="font-sans text-body-sm font-medium text-catalog-muted-text">
                {historyTotal}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-xl rounded-2xl border border-catalog-line bg-surface-lowest p-xl">
          <View className="flex-row items-start gap-md">
            <View
              className={`h-28 w-20 overflow-hidden rounded-xl bg-catalog-muted ${
                humanImage
                  ? 'border border-catalog-line'
                  : 'border border-dashed border-outline-variant'
              }`}
            >
              {humanImage ? (
                <>
                  {/* expo-image does not consume NativeWind classes; fill the token-sized frame. */}
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
                    className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/50 active:bg-black/70"
                    onPress={removeImage}
                  >
                    <X size={14} color={COLORS.onPrimary} />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải ảnh lên"
                  className="flex-1 items-center justify-center gap-1 active:opacity-70"
                  onPress={() => void pickFromLibrary()}
                >
                  <ScanFace size={26} color={COLORS.primaryContainer} />
                </Pressable>
              )}
            </View>

            <View className="flex-1 gap-1">
              <Text className="font-sans text-body-md font-semibold text-on-surface">
                Ảnh của bạn
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">
                Tùy chọn, giúp AI đọc dáng và màu da
              </Text>

              {!humanImage ? (
                <View className="mt-1 flex-row flex-wrap gap-sm">
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending}
                    className="min-h-11 flex-row items-center gap-1.5 rounded-full border border-catalog-line bg-surface-lowest px-md active:bg-catalog-muted"
                    onPress={() => void pickFromLibrary()}
                  >
                    <UploadCloud size={14} color={COLORS.onSurfaceVariant} />
                    <Text className="font-sans text-label-lg text-on-surface-variant">
                      Tải lên
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPending}
                    className="min-h-11 flex-row items-center gap-1.5 rounded-full border border-catalog-line bg-surface-lowest px-md active:bg-catalog-muted"
                    onPress={() => void takePhoto()}
                  >
                    <Camera size={14} color={COLORS.onSurfaceVariant} />
                    <Text className="font-sans text-label-lg text-on-surface-variant">
                      Chụp
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View className="mt-1 flex-row items-center gap-1">
                <ShieldCheck size={12} color={COLORS.success} />
                <Text className="font-sans text-label-md text-catalog-muted-text">
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
                className={`flex-row items-start gap-sm rounded-xl border px-md py-sm ${
                  showConsentError && !imageConsent
                    ? 'border-danger bg-danger/5'
                    : 'border-catalog-line bg-catalog-muted'
                }`}
                onPress={() => {
                  setImageConsent((current) => !current);
                  setShowConsentError(false);
                }}
              >
                <View
                  className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                    imageConsent
                      ? 'border-primary-container bg-primary-container'
                      : 'border-outline-variant bg-surface-lowest'
                  }`}
                >
                  {imageConsent ? <Check size={13} color={COLORS.onPrimary} /> : null}
                </View>
                <Text className="flex-1 font-sans text-body-sm leading-relaxed text-on-surface-variant">
                  {STYLIST_IMAGE_CONSENT_TEXT}
                </Text>
              </Pressable>
              {showConsentError && !imageConsent ? (
                <Text className="font-sans text-body-sm text-danger">
                  Vui lòng đồng ý để AI dùng ảnh phân tích.
                </Text>
              ) : null}
            </View>
          ) : null}

          <OptionGroup icon={Briefcase} label="Dịp mặc">
            <View className="flex-row flex-wrap gap-sm">
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
                    placeholderTextColor={COLORS.catalogMutedText}
                    className="min-h-11 rounded-xl border border-catalog-line bg-catalog-muted px-md font-sans text-body-md text-on-surface"
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

          <OptionGroup icon={Palette} label="Phong cách">
            <View className="flex-row flex-wrap gap-sm">
              {STYLIST_STYLES.map((value) => (
                <OptionChip
                  key={value}
                  label={value}
                  selected={!isCustomStyle && stylePreference === value}
                  onPress={() => {
                    setIsCustomStyle(false);
                    setValue('stylePreference', value, { shouldValidate: true });
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
                    placeholderTextColor={COLORS.catalogMutedText}
                    className="min-h-11 rounded-xl border border-catalog-line bg-catalog-muted px-md font-sans text-body-md text-on-surface"
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

          <OptionGroup icon={Wallet} label="Ngân sách mỗi bộ">
            <View className="flex-row flex-wrap gap-sm">
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

          <OptionGroup icon={UserRound} label="Giới tính">
            <View className="flex-row flex-wrap gap-sm">
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

          <OptionGroup icon={Shirt} label="Món muốn phối cùng">
            {selectedProduct ? (
              <View className="flex-row items-center gap-sm self-start rounded-2xl border border-primary-container/30 bg-primary-container/5 py-1 pl-1.5 pr-sm">
                <View className="h-11 w-9 overflow-hidden rounded-lg bg-catalog-muted">
                  {selectedProduct.imageUrl ? (
                    <Image
                      source={{ uri: selectedProduct.imageUrl }}
                      contentFit="cover"
                      style={StyleSheet.absoluteFill}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Shirt size={18} color={COLORS.catalogMutedText} />
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  className="max-w-40 font-sans text-body-sm font-semibold text-on-surface"
                >
                  {selectedProduct.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Đổi sản phẩm"
                  className="min-h-11 justify-center px-sm"
                  onPress={() => setShowProductPicker(true)}
                >
                  <Text className="font-sans text-label-lg font-semibold text-primary-container">
                    Đổi
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="min-h-11 flex-row items-center gap-1.5 self-start rounded-full border border-dashed border-outline-variant px-md active:bg-catalog-muted"
                onPress={() => setShowProductPicker(true)}
              >
                <Plus size={16} color={COLORS.onSurfaceVariant} />
                <Text className="font-sans text-label-lg text-on-surface-variant">
                  Chọn từ cửa hàng
                </Text>
              </Pressable>
            )}
          </OptionGroup>

          <View className="h-px bg-catalog-line" />

          {formError ? (
            <View className="flex-row items-start gap-sm rounded-xl border border-danger/30 bg-danger/5 p-md">
              <AlertCircle size={16} color={COLORS.danger} />
              <Text className="flex-1 font-sans text-body-sm leading-relaxed text-danger">
                {formError}
              </Text>
            </View>
          ) : null}

          {isPending ? (
            <View className="gap-1 rounded-xl border border-catalog-line bg-catalog-muted p-md">
              <Text className="font-sans text-body-sm font-semibold text-primary-container">
                {analyzeMutation.uploadProgress > 0 &&
                analyzeMutation.uploadProgress < 100
                  ? `Đang tải ảnh lên ${analyzeMutation.uploadProgress}%`
                  : 'AI đang phân tích phong cách của bạn…'}
              </Text>
              <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">
                Phân tích có thể mất đến 90 giây. Vui lòng giữ ứng dụng mở.
              </Text>
              <Pressable
                accessibilityRole="button"
                className="min-h-11 self-start justify-center"
                onPress={analyzeMutation.cancel}
              >
                <Text className="font-sans text-label-lg font-semibold text-primary-container">
                  Hủy chờ
                </Text>
              </Pressable>
            </View>
          ) : null}

          {analyzeMutation.error ? (
            <View className="flex-row items-start gap-sm rounded-xl border border-danger/30 bg-danger/5 p-md">
              <AlertCircle size={16} color={COLORS.danger} />
              <Text className="flex-1 font-sans text-body-sm leading-relaxed text-danger">
                {getErrorMessage(analyzeMutation.error)}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-lg active:opacity-90 ${
              isPending ? 'bg-primary-container/60' : 'bg-primary-container'
            }`}
            onPress={handleSubmit(submit)}
          >
            {isPending ? (
              <>
                <ActivityIndicator size="small" color={COLORS.onPrimary} />
                <Text className="font-sans text-body-md font-bold text-on-primary">
                  Đang phối đồ…
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={18} color={COLORS.onPrimary} />
                <Text className="font-sans text-body-md font-bold text-on-primary">
                  Gợi ý bộ phối
                </Text>
              </>
            )}
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
