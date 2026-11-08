import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ImagePlus, Trash2, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { getErrorMessage } from '@/utils/error-message';
import { useCreateDeliveryDispute } from '../hooks/use-orders';
import type { IEvidenceImage } from '../types/order';
import {
  MAX_DISPUTE_EVIDENCE_IMAGES,
  describeEvidenceRejection,
  pickEvidenceImages,
} from '../utils/evidence-images';

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 2000;

const FILL_IMAGE_STYLE = { width: '100%', height: '100%' } as const;
const LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';

interface Props {
  visible: boolean;
  onClose: () => void;
  orderId: string | number;
  orderCode: string;
  onSuccess?: () => void;
}

export function DeliveryDisputeModal({ visible, onClose, orderId, orderCode, onSuccess }: Props) {
  const pendingRef = useRef(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!pendingRef.current) onClose();
      }}
    >
      {visible ? (
        <DeliveryDisputeForm
          onClose={onClose}
          orderId={orderId}
          orderCode={orderCode}
          onSuccess={onSuccess}
          pendingRef={pendingRef}
        />
      ) : null}
    </Modal>
  );
}

function DeliveryDisputeForm({
  onClose,
  orderId,
  orderCode,
  onSuccess,
  pendingRef,
}: Omit<Props, 'visible'> & { pendingRef: React.MutableRefObject<boolean> }) {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<IEvidenceImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { createDeliveryDisputeAsync, isCreatingDeliveryDispute } = useCreateDeliveryDispute();

  useEffect(() => {
    pendingRef.current = isCreatingDeliveryDispute;
  }, [isCreatingDeliveryDispute, pendingRef]);

  const descriptionLength = description.trim().length;
  const canAddImages = images.length < MAX_DISPUTE_EVIDENCE_IMAGES;
  const canSubmit = descriptionLength >= MIN_DESCRIPTION && !isCreatingDeliveryDispute;

  const handlePickImages = async () => {
    const result = await pickEvidenceImages(MAX_DISPUTE_EVIDENCE_IMAGES - images.length);
    if (result.cancelled) return;

    const rejection = describeEvidenceRejection(result.rejectedSize, result.rejectedType);
    if (rejection) setErrorMsg(rejection);
    else setErrorMsg(null);

    if (result.images.length > 0) {
      setImages((prev) => [...prev, ...result.images].slice(0, MAX_DISPUTE_EVIDENCE_IMAGES));
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMsg(
        `Vui lòng mô tả ít nhất ${MIN_DESCRIPTION} ký tự để shop kiểm tra với đơn vị vận chuyển.`,
      );
      return;
    }

    setErrorMsg(null);
    try {
      await createDeliveryDisputeAsync({ orderId, description: description.trim(), images });
      onSuccess?.();
      onClose();
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Không gửi được báo cáo lúc này. Vui lòng thử lại.'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      <View className="flex-row items-start justify-between gap-3 border-b border-landing-line px-5 pb-4 pt-5">
        <View className="flex-1 gap-1">
          <Text className={LABEL_CLASS}>Chưa nhận được hàng</Text>
          <Text accessibilityRole="header" className="font-display text-[24px] leading-tight text-landing-obsidian">
            Đơn {orderCode}
          </Text>
          <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
            Dùng khi hãng vận chuyển báo đã giao nhưng bạn chưa nhận được kiện hàng. Shop sẽ kiểm
            tra với đơn vị vận chuyển.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          accessibilityState={{ disabled: isCreatingDeliveryDispute }}
          disabled={isCreatingDeliveryDispute}
          onPress={onClose}
          className="-mr-2 h-11 w-11 items-center justify-center active:opacity-60"
        >
          <X size={18} strokeWidth={1.75} color={COLORS.muted} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-10 pt-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {errorMsg ? (
          <View accessibilityRole="alert" className="border-l-2 border-danger bg-landing-ivory px-3 py-2">
            <Text className="font-sans text-[13px] leading-relaxed text-danger">{errorMsg}</Text>
          </View>
        ) : null}

        <View>
          <View className="flex-row items-baseline justify-between gap-3">
            <Text className={LABEL_CLASS}>
              Mô tả tình trạng <Text className="text-danger">*</Text>
            </Text>
            <Text
              className={`font-mono text-[11px] ${
                descriptionLength < MIN_DESCRIPTION ? 'text-brass-ink' : 'text-landing-muted'
              }`}
            >
              {description.length}/{MAX_DESCRIPTION}
            </Text>
          </View>
          <TextInput
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Ví dụ: hãng báo giao lúc 15h nhưng mình không có nhà, không thấy kiện hàng trước cửa…"
            placeholderTextColor={COLORS.muted}
            accessibilityLabel="Mô tả tình trạng"
            maxLength={MAX_DESCRIPTION}
            multiline
            textAlignVertical="top"
            className="mt-2 min-h-[104px] rounded-subtle border border-landing-line bg-landing-ivory px-3 py-2.5 font-sans text-[13px] leading-relaxed text-landing-obsidian"
          />
          <Text className="mt-1.5 font-sans text-[12px] text-landing-muted">
            Tối thiểu {MIN_DESCRIPTION} ký tự.
          </Text>
        </View>

        <View>
          <Text className={LABEL_CLASS}>
            Ảnh minh chứng (tuỳ chọn){' '}
            <Text className="font-mono normal-case tracking-normal text-landing-muted">
              ({images.length}/{MAX_DISPUTE_EVIDENCE_IMAGES})
            </Text>
          </Text>
          <Text className="mt-1 font-sans text-[12px] leading-relaxed text-landing-muted">
            Ảnh trước cửa, biên nhận hoặc tin nhắn với shipper giúp shop đối chiếu nhanh hơn.
          </Text>

          {images.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {images.map((img, idx) => (
                <View
                  key={img.uri}
                  className="h-20 w-16 overflow-hidden rounded-subtle border border-landing-line"
                >
                  <Image source={{ uri: img.uri }} style={FILL_IMAGE_STYLE} contentFit="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ảnh ${idx + 1}`}
                    disabled={isCreatingDeliveryDispute}
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    hitSlop={8}
                    className="absolute right-0.5 top-0.5 h-7 w-7 items-center justify-center rounded-full bg-landing-obsidian/60 active:opacity-70"
                  >
                    <Trash2 size={12} color={COLORS.ivory} />
                  </Pressable>
                </View>
              ))}
              {canAddImages ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Thêm ảnh"
                  disabled={isCreatingDeliveryDispute}
                  onPress={handlePickImages}
                  className="h-20 w-16 items-center justify-center rounded-subtle border border-dashed border-taupe active:opacity-70"
                >
                  <ImagePlus size={18} strokeWidth={1.75} color={COLORS.muted} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thêm ảnh minh chứng"
              disabled={isCreatingDeliveryDispute}
              onPress={handlePickImages}
              className="mt-3 items-center justify-center gap-2 rounded-subtle border border-dashed border-taupe bg-landing-ivory/50 px-4 py-6 active:opacity-70"
            >
              <ImagePlus size={20} strokeWidth={1.75} color={COLORS.muted} />
              <Text className="font-sans text-[13px] font-medium text-landing-muted">Thêm ảnh</Text>
              <Text className="font-sans text-[12px] text-landing-muted">
                Tối đa {MAX_DISPUTE_EVIDENCE_IMAGES} ảnh, mỗi ảnh dưới 10MB
              </Text>
            </Pressable>
          )}
        </View>

        <View className="gap-3 border-t border-landing-line pt-5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi báo cáo"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            className="h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90 disabled:opacity-60"
          >
            {isCreatingDeliveryDispute ? (
              <ActivityIndicator size="small" color={COLORS.ivory} />
            ) : null}
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              {isCreatingDeliveryDispute ? 'Đang gửi' : 'Gửi báo cáo'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Để sau"
            disabled={isCreatingDeliveryDispute}
            onPress={onClose}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Để sau
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
