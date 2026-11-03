import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, Check, ImageUp, Layers, X } from 'lucide-react-native';
import {
  RootStackParamList,
  TryOnStackParamList,
} from '@/navigation/types';
import { useTryOnGenerate } from '@/features/try-on/hooks/use-try-on-generate';
import {
  TryOnCategory,
  TryOnResult,
} from '@/features/try-on/types/try-on';
import { QuotaExhaustedModal } from '@/components/ui/QuotaExhaustedModal';
import {
  UploadableImage,
  toUploadableImage,
} from '@/features/try-on/utils/image-asset';
import {
  validateCombo,
  validatePickedImage,
} from '@/features/try-on/schemas/try-on.schema';
import { readTryOnError } from '@/features/try-on/utils/try-on-error';
import { ApiError } from '@/types/api';
import { IProduct } from '@/features/products/types/product';
import { COLORS } from '@/constants/theme';
import { ComparisonSlider } from '@/features/try-on/components/ComparisonSlider';
import { GarmentSlot } from '@/features/try-on/components/GarmentProductCard';
import { TryOnSegmented } from '@/features/try-on/components/TryOnHeader';
import type { SharedGarmentSelection } from './TryOnWorkspace';

interface PhotoTryOnContentProps {
  selection: SharedGarmentSelection;
  onQuotaConsumed: () => void;
  isBlocked: boolean;
  onPressUpgrade: () => void;
}

const primaryClass =
  'h-12 w-full flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90';
const outlineSmallClass =
  'h-9 flex-row items-center justify-center gap-1.5 rounded-subtle border border-landing-line px-3.5 active:bg-ivory';
const quietSmallClass = 'min-h-9 justify-center active:opacity-70';
const smallLabel = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em]';

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
  error?: string | null;
  onPickLibrary: () => void;
  onPickCamera: () => void;
  onClear: () => void;
}> = ({ uri, error, onPickLibrary, onPickCamera, onClear }) => {
  if (uri) {
    return (
      <View
        className="w-full overflow-hidden border border-landing-line bg-ivory"
        style={{ aspectRatio: 3 / 4 }}
      >
        <Image
          source={{ uri }}
          style={{ flex: 1 }}
          contentFit="contain"
          transition={200}
          accessibilityLabel="Ảnh toàn thân đã chọn"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bỏ ảnh đã chọn"
          onPress={onClear}
          className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-subtle border border-landing-line bg-landing-paper active:opacity-70"
        >
          <X size={16} strokeWidth={1.75} color={COLORS.obsidian} />
        </Pressable>
        <View className="absolute bottom-3 left-3 right-3 flex-row items-center gap-2 border border-landing-line bg-landing-paper px-3 py-2">
          <Check size={14} strokeWidth={2} color={COLORS.sageInk} />
          <Text className="flex-1 font-sans text-body-sm text-landing-obsidian">
            Ảnh đã sẵn sàng để thử
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`w-full items-center justify-center border border-dashed px-6 ${
        error ? 'border-danger/60 bg-ivory/60' : 'border-taupe bg-ivory/60'
      }`}
      style={{ aspectRatio: 3 / 4 }}
    >
      <View className="h-12 w-12 items-center justify-center border border-landing-line">
        <ImageUp size={20} strokeWidth={1.5} color={COLORS.oxblood} />
      </View>
      <Text className="mt-5 text-center font-display text-[22px] leading-tight text-landing-obsidian">
        Thả ảnh toàn thân vào đây
      </Text>
      <Text className="mt-2 max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
        Đứng thẳng, đủ sáng, thấy rõ từ vai tới chân.
      </Text>
      <View className="mt-6 flex-row flex-wrap justify-center gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={onPickLibrary}
          className="h-9 items-center justify-center rounded-subtle bg-oxblood px-3.5 active:opacity-90"
        >
          <Text className={`${smallLabel} text-landing-paper`}>Chọn ảnh</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onPickCamera}
          className={outlineSmallClass}
        >
          <Camera size={14} strokeWidth={1.75} color={COLORS.obsidian} />
          <Text className={`${smallLabel} text-landing-obsidian`}>Chụp ảnh</Text>
        </Pressable>
      </View>
      <Text className="mt-4 font-mono text-[11px] text-landing-muted">
        PNG, JPG · tối đa 10MB
      </Text>
      {error ? (
        <Text className="mt-3 max-w-[300px] text-center font-sans text-body-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export const PhotoTryOnContent: React.FC<PhotoTryOnContentProps> = ({
  selection,
  onQuotaConsumed,
  isBlocked,
  onPressUpgrade,
}) => {
  const { singleProduct, comboOuter, comboUpper, comboLower, clearOuter, openPicker } =
    selection;
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<TryOnStackParamList>>();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const generate = useTryOnGenerate();

  const [humanImage, setHumanImage] = useState<UploadableImage | null>(null);
  const [mode, setMode] = useState<'single' | 'combo'>('single');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverAction, setServerAction] = useState<'subscription' | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  const handleHumanPick = async (useCamera: boolean) => {
    const picked = await pickImage(useCamera);
    if (!picked) return;
    const validationError = validatePickedImage(picked);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setHumanImage(picked);
  };

  const canSubmit =
    !!humanImage &&
    (mode === 'single' ? !!singleProduct : !!(comboUpper && comboLower));
  const selectedCount =
    mode === 'combo'
      ? [comboOuter, comboUpper, comboLower].filter(Boolean).length
      : 1;

  const handleGenerate = async () => {
    // Chặn request trùng khi đang processing.
    if (generate.isPending) return;
    if (!humanImage) {
      setFormError('Vui lòng chọn ảnh toàn thân của bạn trước.');
      return;
    }
    if (mode === 'single' && !singleProduct) {
      setFormError('Vui lòng chọn sản phẩm cần thử.');
      return;
    }
    if (mode === 'combo' && (!comboUpper || !comboLower)) {
      setFormError('Chế độ phối bộ cần chọn cả áo và quần/váy.');
      return;
    }
    if (mode === 'combo' && comboUpper && comboLower) {
      const comboError = validateCombo(
        { productId: String(comboUpper.id), category: comboUpper.category },
        { productId: String(comboLower.id), category: comboLower.category },
      );
      if (comboError) {
        setFormError(comboError);
        return;
      }
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
              ...(comboOuter
                ? [{ category: 'UPPER' as TryOnCategory, productId: String(comboOuter.id) }]
                : []),
              { category: 'UPPER' as TryOnCategory, productId: String((comboUpper as IProduct).id) },
              { category: 'LOWER' as TryOnCategory, productId: String((comboLower as IProduct).id) },
            ]
          : [
              {
                category: (singleProduct as IProduct).category,
                productId: String((singleProduct as IProduct).id),
              },
            ];
      generate.mutate(
        { humanImage: preparedHuman, garments, onProgress: setProgress },
        {
          onSuccess: (data) => {
            setResult(data);
            onQuotaConsumed();
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
        setShowQuotaModal(true);
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

  const resetResult = () => {
    generate.reset();
    setResult(null);
    setProgress(0);
    setServerError(null);
    setServerAction(null);
  };

  const changePhoto = () => {
    resetResult();
    setHumanImage(null);
    setFormError(null);
  };

  const isBusy = generate.isPending;

  return (
    <View>
      {result && humanImage ? (
        <View>
          <View className="mb-4 flex-row items-baseline justify-between gap-4">
            <Text className="font-display text-[22px] leading-tight text-landing-obsidian">
              Kết quả
            </Text>
            <Text className="font-sans text-[11px] text-landing-muted">
              Kéo để so sánh trước và sau
            </Text>
          </View>

          <ComparisonSlider before={humanImage.uri} after={result.resultUrl} />

          <View className="mt-4 flex-row flex-wrap items-center gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={resetResult}
              className={outlineSmallClass}
            >
              <Text className={`${smallLabel} text-landing-obsidian`}>Thử món khác</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={changePhoto}
              className={quietSmallClass}
            >
              <Text className={`${smallLabel} text-landing-muted`}>Đổi ảnh</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => stackNavigation.navigate('TryOnHistory')}
              className={`${quietSmallClass} ml-auto`}
            >
              <Text className={`${smallLabel} text-landing-muted`}>Lịch sử thử đồ</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <View className="mb-4 flex-row items-baseline justify-between gap-4">
            <Text className="font-display text-[22px] leading-tight text-landing-obsidian">
              Ảnh của bạn
            </Text>
            <Text className="font-sans text-[11px] text-landing-muted">
              Một người, thấy rõ toàn thân
            </Text>
          </View>

          <View className="relative">
            <UploadZone
              uri={humanImage?.uri}
              error={formError}
              onPickLibrary={() => handleHumanPick(false)}
              onPickCamera={() => handleHumanPick(true)}
              onClear={() => {
                setHumanImage(null);
                setFormError(null);
              }}
            />

            {isBusy ? (
              <View className="absolute inset-0 items-center justify-center gap-3 border border-landing-line bg-landing-paper/90 px-6">
                <ActivityIndicator color={COLORS.oxblood} />
                <Text className="text-center font-display text-[22px] leading-tight text-landing-obsidian">
                  Đang thử trang phục
                </Text>
                <Text className="max-w-[260px] text-center font-sans text-body-sm leading-relaxed text-landing-muted">
                  Giữ nguyên ảnh và trang phục cho tới khi có kết quả.
                  {progress > 0 ? ` ${progress}%` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          {isBusy ? (
            <View className="mt-4 h-1.5 overflow-hidden bg-ivory">
              <View
                style={{ width: `${Math.max(progress, 4)}%` }}
                className="h-full bg-oxblood"
              />
            </View>
          ) : null}

          <View className="mt-8">
            <View className="mb-4 flex-row items-baseline justify-between gap-3">
              <Text className="font-display text-[22px] leading-tight text-landing-obsidian">
                Trang phục
              </Text>
              <Text className="font-mono text-xs text-landing-muted">
                {String(selectedCount).padStart(2, '0')} món
              </Text>
            </View>

            <TryOnSegmented
              value={mode}
              onChange={setMode}
              disabled={isBusy}
              options={[
                { value: 'single', label: 'Một món' },
                {
                  value: 'combo',
                  label: 'Phối bộ',
                  icon: (selected) => (
                    <Layers
                      size={14}
                      strokeWidth={1.75}
                      color={selected ? COLORS.paper : COLORS.obsidian}
                    />
                  ),
                },
              ]}
            />

            <View className="mt-5">
              {mode === 'single' ? (
                <GarmentSlot
                  label="Trang phục"
                  product={singleProduct}
                  emptyLabel="Chưa chọn trang phục"
                  onChange={() => openPicker('single')}
                  disabled={isBusy}
                />
              ) : (
                <View className="border-y border-landing-line">
                  <View className="border-b border-landing-line py-4">
                    <GarmentSlot
                      label="Lớp ngoài"
                      hint="Tùy chọn"
                      product={comboOuter}
                      emptyLabel="Áo khoác hoặc blazer"
                      onChange={() => openPicker('outer')}
                      onClear={comboOuter ? clearOuter : undefined}
                      disabled={isBusy}
                    />
                  </View>
                  <View className="border-b border-landing-line py-4">
                    <GarmentSlot
                      label="Lớp trong"
                      product={comboUpper}
                      emptyLabel="Sơ mi hoặc áo trong"
                      onChange={() => openPicker('upper')}
                      disabled={isBusy}
                    />
                  </View>
                  <View className="py-4">
                    <GarmentSlot
                      label="Phần dưới"
                      product={comboLower}
                      emptyLabel="Quần hoặc chân váy"
                      onChange={() => openPicker('lower')}
                      disabled={isBusy}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {formError ? (
            <Text className="mt-4 font-sans text-body-sm text-danger">{formError}</Text>
          ) : null}

          {serverError ? (
            <View className="mt-4 border-l-2 border-danger bg-ivory px-4 py-3">
              <Text className="font-sans text-body-sm leading-relaxed text-danger">
                {serverError}
              </Text>
              {serverAction === 'subscription' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => rootNavigation.navigate('SubscriptionPlans')}
                  className="mt-3 h-10 items-center justify-center self-start rounded-subtle bg-oxblood px-4 active:opacity-90"
                >
                  <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                    Xem gói hội viên
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="mt-6">
            <Pressable
              accessibilityRole="button"
              disabled={!isBlocked && (!canSubmit || isBusy)}
              onPress={isBlocked ? onPressUpgrade : handleGenerate}
              className={`${primaryClass} ${
                !isBlocked && (!canSubmit || isBusy) ? 'opacity-45' : ''
              }`}
            >
              {isBusy ? (
                <ActivityIndicator color={COLORS.paper} size="small" />
              ) : null}
              <Text className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
                {isBlocked
                  ? 'Nâng cấp gói để thử'
                  : isBusy
                    ? 'Đang thử trang phục'
                    : 'Thử trang phục'}
              </Text>
            </Pressable>
            <Text className="mt-2.5 font-sans text-body-sm leading-relaxed text-landing-muted">
              Dùng{' '}
              <Text className="font-mono text-landing-obsidian">
                {mode === 'combo' ? Math.max(1, selectedCount) : 1}
              </Text>{' '}
              lượt (mỗi món 1 lượt). Kết quả tự lưu vào lịch sử thử đồ.
            </Text>
          </View>
        </View>
      )}

      <QuotaExhaustedModal
        visible={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        actionName="Thử đồ AI"
      />
    </View>
  );
};

export default PhotoTryOnContent;
