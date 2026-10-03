import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { RootStackParamList, TryOnStackParamList } from '@/navigation/types';
import { authApi } from '@/features/auth/api/auth.api';
import { useTryOnGenerate } from '@/features/try-on/hooks/use-try-on-generate';
import {
  TryOnCategory,
  TryOnResult,
} from '@/features/try-on/types/try-on';
import {
  UploadableImage,
  toUploadableImage,
} from '@/features/try-on/utils/image-asset';
import { validatePickedImage } from '@/features/try-on/schemas/try-on.schema';
import { readTryOnError } from '@/features/try-on/utils/try-on-error';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TryOnHeader } from '@/features/try-on/components/TryOnHeader';

type Props = NativeStackScreenProps<TryOnStackParamList, 'TryOnHome'>;

const CATEGORY_OPTIONS: { value: TryOnCategory; label: string }[] = [
  { value: 'UPPER', label: 'Áo' },
  { value: 'LOWER', label: 'Quần/Váy' },
  { value: 'FULL_BODY', label: 'Nguyên bộ' },
];

const CATEGORY_LABELS: Record<TryOnCategory, string> = {
  UPPER: 'Áo',
  LOWER: 'Quần/Váy',
  FULL_BODY: 'Nguyên bộ',
};

// Nén ảnh còn tối đa 2048px, JPEG 80% để chắc chắn dưới giới hạn 10MB của BE.
async function prepareUploadImage(image: UploadableImage): Promise<UploadableImage> {
  const manipulated = await manipulateAsync(
    image.uri,
    [{ resize: { width: 2048 } }],
    { compress: 0.8, format: SaveFormat.JPEG },
  );
  return { uri: manipulated.uri, name: image.name.replace(/\.\w+$/, '.jpg'), type: 'image/jpeg' };
}

async function pickImage(useCamera: boolean): Promise<UploadableImage | null> {
  const permission = useCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Cần quyền truy cập',
      useCamera
        ? 'FashionAI cần quyền camera để chụp ảnh thử đồ.'
        : 'FashionAI cần quyền thư viện ảnh để chọn ảnh thử đồ.',
    );
    return null;
  }

  const result = useCamera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || result.assets.length === 0) return null;
  return toUploadableImage(result.assets[0]);
}

const UploadZone: React.FC<{
  uri?: string | null;
  emptyTitle: string;
  emptyHint: string;
  onPickLibrary: () => void;
  onPickCamera: () => void;
  selfieLabel?: string;
}> = ({ uri, emptyTitle, emptyHint, onPickLibrary, onPickCamera, selfieLabel }) => {
  if (uri) {
    return (
      <View>
        <View className="overflow-hidden rounded-xl border border-surface-line">
          {/* NativeWind không có token aspect 3:4 nên dùng aspectRatio tính toán */}
          <Image
            source={{ uri }}
            style={{ aspectRatio: 3 / 4 }}
            className="w-full"
            contentFit="cover"
            transition={200}
          />
        </View>
        <View className="mt-sm flex-row gap-md">
          <View className="flex-1">
            <Button title="Chọn ảnh khác" variant="outline" size="sm" onPress={onPickLibrary} />
          </View>
          <View className="flex-1">
            <Button title="Chụp lại" variant="outline" size="sm" onPress={onPickCamera} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xxl">
      <View className="mb-md h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name="cloud-upload-outline" size={30} className="text-primary-container" />
      </View>
      <Text className="text-center text-body-lg font-bold text-on-surface">{emptyTitle}</Text>
      <Text className="mt-xs text-center text-body-sm text-on-surface-variant">
        {emptyHint}
      </Text>
      <View className="mt-md w-full flex-row gap-md">
        <View className="flex-1">
          <Button title="Chọn từ thư viện" variant="outline" size="sm" onPress={onPickLibrary} />
        </View>
        <View className="flex-1">
          <Button
            title={selfieLabel ?? 'Chụp ảnh'}
            variant="outline"
            size="sm"
            onPress={onPickCamera}
          />
        </View>
      </View>
      <Text className="mt-md text-body-sm text-on-surface-variant">PNG, JPG tối đa 10MB</Text>
    </View>
  );
};

export const TryOnScreen: React.FC<Props> = ({ navigation, route }) => {
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const generate = useTryOnGenerate();

  const entryProductId = route.params?.productId;
  const [humanImage, setHumanImage] = useState<UploadableImage | null>(null);
  const [garmentImage, setGarmentImage] = useState<UploadableImage | null>(null);
  const [upperImage, setUpperImage] = useState<UploadableImage | null>(null);
  const [lowerImage, setLowerImage] = useState<UploadableImage | null>(null);
  const [productId, setProductId] = useState<string | undefined>(entryProductId);
  const [mode, setMode] = useState<'single' | 'combo'>('single');
  const [category, setCategory] = useState<TryOnCategory>(
    route.params?.category ?? 'UPPER',
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverAction, setServerAction] = useState<'subscription' | null>(null);
  const [quota, setQuota] = useState<{ remaining?: number; limit?: number } | null>(null);

  const isBusy = generate.isPending;

  useEffect(() => {
    let active = true;
    authApi
      .getUserQuota('TRY_ON')
      .then((data: any) => {
        if (!active) return;
        const q = data?.TRY_ON ?? data?.try_on ?? data;
        if (typeof q?.remaining === 'number' || typeof q?.limit === 'number') {
          setQuota({ remaining: q.remaining, limit: q.limit });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const refreshQuota = () => {
    authApi
      .getUserQuota('TRY_ON')
      .then((data: any) => {
        const q = data?.TRY_ON ?? data?.try_on ?? data;
        if (typeof q?.remaining === 'number' || typeof q?.limit === 'number') {
          setQuota({ remaining: q.remaining, limit: q.limit });
        }
      })
      .catch(() => {});
  };

  const handlePick = async (
    useCamera: boolean,
    target: 'human' | 'garment' | 'upper' | 'lower',
  ) => {
    const picked = await pickImage(useCamera);
    if (!picked) return;
    const validationError = validatePickedImage(picked);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    if (target === 'human') setHumanImage(picked);
    if (target === 'garment') {
      setGarmentImage(picked);
      setProductId(undefined);
    }
    if (target === 'upper') setUpperImage(picked);
    if (target === 'lower') setLowerImage(picked);
  };

  const canSubmit =
    !!humanImage &&
    (mode === 'single' ? !!(garmentImage || productId) : !!(upperImage && lowerImage));

  const handleGenerate = async () => {
    // Chặn request trùng khi đang processing.
    if (generate.isPending) return;
    if (!humanImage) {
      setFormError('Vui lòng chọn ảnh toàn thân của bạn trước.');
      return;
    }
    if (mode === 'single' && !garmentImage && !productId) {
      setFormError('Vui lòng chọn ảnh trang phục hoặc sản phẩm cần thử.');
      return;
    }
    if (mode === 'combo' && (!upperImage || !lowerImage)) {
      setFormError('Chế độ phối bộ cần ảnh cho cả áo và quần/váy.');
      return;
    }
    setFormError(null);
    setServerError(null);
    setServerAction(null);
    setResult(null);
    setProgress(0);

    try {
      const preparedHuman = await prepareUploadImage(humanImage);
      const garments =
        mode === 'combo'
          ? [
              { category: 'UPPER' as TryOnCategory, garmentImage: await prepareUploadImage(upperImage as UploadableImage) },
              { category: 'LOWER' as TryOnCategory, garmentImage: await prepareUploadImage(lowerImage as UploadableImage) },
            ]
          : garmentImage
            ? [{ category, garmentImage: await prepareUploadImage(garmentImage) }]
            : [{ category, productId: productId as string }];
      generate.mutate(
        { humanImage: preparedHuman, garments, onProgress: setProgress },
        {
          onSuccess: (data) => {
            setResult(data);
            setShowOriginal(false);
            refreshQuota();
          },
          onError: onGenerateError,
        },
      );
    } catch {
      setFormError('Không chuẩn bị được ảnh. Vui lòng thử ảnh khác.');
    }
  };

  const onGenerateError = (error: Error) => {
    if (!(error instanceof ApiError)) {
      setServerError(error.message || 'Đã xảy ra lỗi, vui lòng thử lại.');
      return;
    }
    const action = readTryOnError(error);
    switch (action.kind) {
      case 'subscription-required':
        setServerError('Tính năng thử đồ AI cần gói hội viên. Nâng cấp để tiếp tục.');
        setServerAction('subscription');
        break;
      case 'quota-exceeded':
        setServerError(
          action.remaining === 0
            ? 'Bạn đã hết lượt thử đồ hôm nay. Quota sẽ được làm mới vào ngày mai.'
            : 'Bạn đã vượt quá số lượt thử đồ cho phép.',
        );
        setServerAction('subscription');
        break;
      case 'duplicate-request':
        setServerError('Yêu cầu này đang được xử lý. Vui lòng đợi kết quả.');
        break;
      case 'image-quality-rejected':
        setServerError(action.message);
        break;
      case 'measurements-incomplete':
        setServerError(
          action.missing.length > 0
            ? `Vui lòng bổ sung số đo còn thiếu: ${action.missing.join(', ')}.`
            : 'Vui lòng bổ sung số đo cơ thể để có kết quả chính xác.',
        );
        break;
      default:
        setServerError(action.message);
        break;
    }
  };

  const resetWorkspace = () => {
    generate.reset();
    setResult(null);
    setShowOriginal(false);
    setProgress(0);
    setServerError(null);
    setServerAction(null);
  };

  const goLive = () =>
    navigation.navigate('TryOnLive', {
      productId,
      productName: route.params?.productName,
      productImageUrl: route.params?.productImageUrl,
      category,
    });

  return (
    <View className="flex-1 bg-background">
      <TryOnHeader />
      <ScrollView className="flex-1" contentContainerClassName="p-xl">

      <Text className="font-heading text-headline-lg font-bold text-primary-container">
        Virtual Try-On
      </Text>
      <Text className="mt-xs text-body-sm text-on-surface-variant">
        Thử trang phục công sở bằng công nghệ AI
      </Text>

      <View className="mt-md flex-row items-center justify-between">
        {typeof quota?.remaining === 'number' && typeof quota?.limit === 'number' ? (
          <View className="rounded-full border border-outline-variant bg-surface-lowest px-md py-xs">
            <Text className="text-body-sm font-semibold text-primary-container">
              Còn {quota.remaining} / {quota.limit} lượt hôm nay
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          className="min-h-11 justify-center px-sm"
          onPress={() => navigation.navigate('TryOnHistory')}
        >
          <Text className="text-label-lg text-primary-container">Lịch sử thử đồ ›</Text>
        </Pressable>
      </View>

      <View className="mt-lg">
        <SegmentedControl
          options={[
            { value: 'photo', label: 'Thử bằng ảnh' },
            { value: 'live', label: 'Live Try-on' },
          ]}
          value="photo"
          onChange={(next) => {
            if (next === 'live') goLive();
          }}
        />
      </View>

      {result && humanImage ? (
        <View className="mt-xl">
          <Text className="mb-sm font-heading text-headline-sm font-bold text-on-surface">
            Ảnh của bạn / Kết quả
          </Text>
          <View className="overflow-hidden rounded-xl border border-surface-line bg-surface-lowest shadow-sm">
            <Image
              source={{ uri: showOriginal ? humanImage.uri : result.resultUrl }}
              style={{ aspectRatio: 3 / 4 }}
              className="w-full"
              contentFit="cover"
              transition={300}
            />
            {isBusy ? (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text className="mt-md text-body-lg font-bold text-inverse-on-surface">
                  AI đang khớp trang phục...
                </Text>
                <Text className="mt-xs text-body-sm text-inverse-on-surface">
                  Vui lòng giữ nguyên màn hình
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mt-md flex-row rounded-lg bg-surface-container p-xs">
            <Pressable
              className={`min-h-11 flex-1 items-center justify-center rounded-md ${
                showOriginal ? 'bg-surface-lowest' : ''
              }`}
              onPress={() => setShowOriginal(true)}
            >
              <Text
                className={`text-label-lg ${showOriginal ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                Ảnh gốc
              </Text>
            </Pressable>
            <Pressable
              className={`min-h-11 flex-1 items-center justify-center rounded-md ${
                !showOriginal ? 'bg-surface-lowest' : ''
              }`}
              onPress={() => setShowOriginal(false)}
            >
              <Text
                className={`text-label-lg ${!showOriginal ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                Kết quả
              </Text>
            </Pressable>
          </View>

          <View className="mt-md">
            <Button title="Thử món khác" variant="outline" onPress={resetWorkspace} />
            <Button
              className="mt-md"
              title="Xem lịch sử"
              variant="ghost"
              onPress={() => navigation.navigate('TryOnHistory')}
            />
          </View>
        </View>
      ) : (
        <View className="mt-xl">
          <Text className="mb-xs font-heading text-headline-sm font-bold text-on-surface">
            Ảnh của bạn / Kết quả
          </Text>
          <Text className="mb-md text-body-sm text-on-surface-variant">
            Khung ảnh toàn thân, giữ nguyên tỷ lệ để dễ so sánh.
          </Text>
          <UploadZone
            uri={humanImage?.uri}
            emptyTitle="Tải ảnh toàn thân của bạn"
            emptyHint="Ảnh rõ nét, đủ sáng, thấy toàn thân từ đầu đến chân."
            onPickLibrary={() => handlePick(false, 'human')}
            onPickCamera={() => handlePick(true, 'human')}
            selfieLabel="Chụp ảnh selfie"
          />

          <View className="mt-md flex-row gap-sm rounded-lg bg-primary-soft p-md">
            <Ionicons
              name="information-circle-outline"
              size={20}
              className="text-primary-container"
            />
            <Text className="flex-1 text-body-sm leading-relaxed text-on-surface">
              Hãy tải ảnh cá nhân PNG/JPG dưới 10MB, toàn thân rõ nét để tạo kết quả
              thử đồ.
            </Text>
          </View>

          <Text className="mb-xs mt-xxl font-heading text-headline-sm font-bold text-on-surface">
            Trang phục
          </Text>
          <Text className="mb-md text-body-sm text-on-surface-variant">
            Chọn một món hoặc phối áo với quần/váy.
          </Text>
          <SegmentedControl
            options={[
              { value: 'single', label: 'Một món' },
              { value: 'combo', label: 'Phối bộ' },
            ]}
            value={mode}
            onChange={(next) => setMode(next as 'single' | 'combo')}
          />

          {mode === 'single' ? (
            <View className="mt-md">
              {productId ? (
                <View className="mb-md flex-row items-center gap-md rounded-xl border border-surface-line bg-surface-lowest p-md shadow-sm">
                  {route.params?.productImageUrl ? (
                    <Image
                      source={{ uri: route.params.productImageUrl }}
                      className="h-20 w-16 rounded-md"
                      contentFit="cover"
                    />
                  ) : null}
                  <View className="flex-1">
                    <Text className="text-body-sm font-semibold text-on-surface">
                      {route.params?.productName ?? 'Sản phẩm đã chọn'}
                    </Text>
                    <View className="mt-xs self-start rounded-full bg-primary-soft px-md py-xs">
                      <Text className="text-label-md text-primary-container">
                        {CATEGORY_LABELS[category]}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    className="min-h-11 justify-center px-sm"
                    onPress={() => setProductId(undefined)}
                  >
                    <Text className="text-label-lg text-primary-container">Thay đổi</Text>
                  </Pressable>
                </View>
              ) : null}
              <UploadZone
                uri={garmentImage?.uri}
                emptyTitle="Tải ảnh trang phục"
                emptyHint="Chụp hoặc chọn ảnh áo/quần phẳng, nền sáng."
                onPickLibrary={() => handlePick(false, 'garment')}
                onPickCamera={() => handlePick(true, 'garment')}
              />
              <Text className="mb-sm mt-md text-body-sm font-semibold text-on-surface">
                Loại trang phục
              </Text>
              <View className="flex-row gap-md">
                {CATEGORY_OPTIONS.map((option) => {
                  const selected = category === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      className={`min-h-11 flex-1 items-center justify-center rounded-full px-md ${
                        selected ? 'bg-primary-container' : 'bg-surface-low'
                      }`}
                      onPress={() => setCategory(option.value)}
                    >
                      <Text
                        className={`text-label-lg ${
                          selected ? 'text-primary-foreground' : 'text-on-surface'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View className="mt-md gap-xl">
              <View>
                <Text className="mb-sm text-body-sm font-semibold text-on-surface">
                  Áo (UPPER)
                </Text>
                <UploadZone
                  uri={upperImage?.uri}
                  emptyTitle="Tải ảnh áo"
                  emptyHint="Áo sơ mi, áo kiểu phẳng, nền sáng."
                  onPickLibrary={() => handlePick(false, 'upper')}
                  onPickCamera={() => handlePick(true, 'upper')}
                />
              </View>
              <View>
                <Text className="mb-sm text-body-sm font-semibold text-on-surface">
                  Quần/Váy (LOWER)
                </Text>
                <UploadZone
                  uri={lowerImage?.uri}
                  emptyTitle="Tải ảnh quần/váy"
                  emptyHint="Quần/váy công sở phẳng, nền sáng."
                  onPickLibrary={() => handlePick(false, 'lower')}
                  onPickCamera={() => handlePick(true, 'lower')}
                />
              </View>
            </View>
          )}

          {formError ? (
            <Text className="mt-md text-center text-body-sm text-danger">{formError}</Text>
          ) : null}
          {serverError ? (
            <View className="mt-md rounded-lg border border-surface-line bg-surface-lowest p-md">
              <Text className="text-center text-body-sm text-danger">{serverError}</Text>
              {serverAction === 'subscription' ? (
                <Button
                  className="mt-md"
                  title="Xem gói hội viên"
                  size="sm"
                  onPress={() => rootNavigation.navigate('SubscriptionPlans')}
                />
              ) : null}
            </View>
          ) : null}

          {isBusy ? (
            <View className="mt-xl">
              <View className="h-2 overflow-hidden rounded-full bg-surface-container">
                {/* width tính theo tiến độ upload nên dùng style động */}
                <View style={{ width: `${progress}%` }} className="h-full bg-primary-container" />
              </View>
              <View className="mt-md flex-row items-center justify-center gap-sm">
                <ActivityIndicator size="small" color="#5D1C34" />
                <Text className="text-body-sm text-on-surface-variant">
                  AI đang khớp trang phục... {progress > 0 ? `${progress}%` : ''}
                </Text>
              </View>
            </View>
          ) : (
            <View className="mt-xl">
              <Button
                title="Thử trang phục"
                onPress={handleGenerate}
                disabled={!canSubmit}
                textClassName="text-primary-foreground"
              />
              <Text className="mt-md text-center text-body-sm text-on-surface-variant">
                Chi phí: 1 lượt thử. Kết quả được lưu tự động vào lịch sử.
              </Text>
            </View>
          )}
          <Text className="mt-lg text-center text-body-sm text-on-surface-variant">
            Ảnh của bạn chỉ dùng để tạo kết quả thử đồ và được bảo mật.
          </Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
};

export default TryOnScreen;
