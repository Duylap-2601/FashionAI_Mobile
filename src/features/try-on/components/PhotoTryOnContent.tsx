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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { GarmentProductCard, GarmentPreview } from '@/features/try-on/components/GarmentProductCard';
import type { SharedGarmentSelection } from './TryOnWorkspace';

interface PhotoTryOnContentProps {
  selection: SharedGarmentSelection;
  onQuotaConsumed: () => void;
}

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

export const PhotoTryOnContent: React.FC<PhotoTryOnContentProps> = ({
  selection,
  onQuotaConsumed,
}) => {
  const { singleProduct, comboUpper, comboLower, openPicker } = selection;
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<TryOnStackParamList>>();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const generate = useTryOnGenerate();

  const [humanImage, setHumanImage] = useState<UploadableImage | null>(null);
  const [mode, setMode] = useState<'single' | 'combo'>('single');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverAction, setServerAction] = useState<'subscription' | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const isBusy = generate.isPending;

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
            setShowOriginal(false);
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

  const resetWorkspace = () => {
    generate.reset();
    setResult(null);
    setShowOriginal(false);
    setProgress(0);
    setServerError(null);
    setServerAction(null);
  };

  return (
    <View className="mt-xl">
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
              onPress={() => stackNavigation.navigate('TryOnHistory')}
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
            onPickLibrary={() => handleHumanPick(false)}
            onPickCamera={() => handleHumanPick(true)}
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
              {singleProduct ? (
                <>
                  <GarmentProductCard
                    product={singleProduct}
                    onChange={() => openPicker('single')}
                  />
                  <GarmentPreview product={singleProduct} label={singleProduct.name} />
                </>
              ) : (
                <Pressable
                  className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xxl"
                  onPress={() => openPicker('single')}
                >
                  <View className="mb-md h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
                    <Ionicons name="shirt-outline" size={30} className="text-primary-container" />
                  </View>
                  <Text className="text-center text-body-lg font-bold text-on-surface">
                    Chưa chọn trang phục
                  </Text>
                  <Text className="mb-md mt-xs text-center text-body-sm text-on-surface-variant">
                    Chọn từ danh sách sản phẩm của FashionAI.
                  </Text>
                  <Button title="Chọn sản phẩm" variant="outline" size="sm" onPress={() => openPicker('single')} />
                </Pressable>
              )}
            </View>
          ) : (
            <View className="mt-md gap-xl">
              <View>
                <View className="mb-sm">
                  <Text className="text-body-sm font-semibold text-on-surface">
                    Món 1: Áo / Blazer (Upper)
                  </Text>
                </View>
                {comboUpper ? (
                  <>
                    <GarmentProductCard
                      product={comboUpper}
                      onChange={() => openPicker('upper')}
                      changeLabel="Đổi áo khác"
                    />
                    <GarmentPreview product={comboUpper} label={comboUpper.name} />
                  </>
                ) : (
                  <Pressable
                    className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xl"
                    onPress={() => openPicker('upper')}
                  >
                    <Text className="text-center text-body-sm font-semibold text-on-surface">
                      Chưa chọn áo
                    </Text>
                    <Text className="mt-xs text-center text-body-sm text-primary-container">
                      Chọn áo ›
                    </Text>
                  </Pressable>
                )}
              </View>
              <View>
                <View className="mb-sm">
                  <Text className="text-body-sm font-semibold text-on-surface">
                    Món 2: Quần / Chân váy (Lower)
                  </Text>
                </View>
                {comboLower ? (
                  <>
                    <GarmentProductCard
                      product={comboLower}
                      onChange={() => openPicker('lower')}
                      changeLabel="Đổi quần/váy khác"
                    />
                    <GarmentPreview product={comboLower} label={comboLower.name} />
                  </>
                ) : (
                  <Pressable
                    className="items-center rounded-xl border border-dashed border-outline-variant bg-surface-lowest p-xl"
                    onPress={() => openPicker('lower')}
                  >
                    <Text className="text-center text-body-sm font-semibold text-on-surface">
                      Chưa chọn quần/váy
                    </Text>
                    <Text className="mt-xs text-center text-body-sm text-primary-container">
                      Chọn quần/váy ›
                    </Text>
                  </Pressable>
                )}
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
                {mode === 'combo'
                  ? 'Chi phí: 2 lượt thử (mỗi món 1 lượt). Kết quả được lưu tự động vào lịch sử.'
                  : 'Chi phí: 1 lượt thử. Kết quả được lưu tự động vào lịch sử.'}
              </Text>
            </View>
          )}
          <Text className="mt-lg text-center text-body-sm text-on-surface-variant">
            Ảnh của bạn chỉ dùng để tạo kết quả thử đồ và được bảo mật.
          </Text>
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
