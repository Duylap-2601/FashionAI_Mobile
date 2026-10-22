import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ImagePlus, AlertTriangle, Check, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { OrderIssueReason, OrderIssueDesiredResolution, IOrderItem } from '../types/order';
import { useCreateOrderIssue } from '../hooks/use-orders';

interface Props {
  visible: boolean;
  onClose: () => void;
  orderId: string | number;
  orderItem: any | null;
  onSuccess?: () => void;
}

const REASONS: { value: OrderIssueReason; label: string; desc: string }[] = [
  {
    value: 'WRONG_SIZE',
    label: 'Sai kích thước / số đo',
    desc: 'Sản phẩm may không khớp với thông số số đo trong hồ sơ.',
  },
  {
    value: 'WRONG_COLOR',
    label: 'Sai màu sắc',
    desc: 'Màu sắc thực tế khác biệt đáng kể so với mẫu đã chọn.',
  },
  {
    value: 'QUALITY_MISMATCH',
    label: 'Lỗi đường may / Chất lượng vải',
    desc: 'Sản phẩm bị sờn, rách, lỗi đường chỉ hoặc vải không đạt yêu cầu.',
  },
  {
    value: 'OTHER',
    label: 'Lý do khác',
    desc: 'Vấn đề phát sinh khác (đội ngũ hỗ trợ sẽ liên hệ xử lý trực tiếp).',
  },
];

const RESOLUTIONS: { value: OrderIssueDesiredResolution; label: string; desc: string }[] = [
  {
    value: 'EXCHANGE',
    label: 'Đổi hàng 1-1',
    desc: 'May lại sản phẩm mới và gửi đến tận nơi cho bạn.',
  },
  {
    value: 'REFUND',
    label: 'Hoàn tiền',
    desc: 'Xử lý hoàn trả số tiền sản phẩm về tài khoản ngân hàng.',
  },
];

export function ReportIssueModal({ visible, onClose, orderId, orderItem, onSuccess }: Props) {
  const [reason, setReason] = useState<OrderIssueReason>('WRONG_SIZE');
  const [description, setDescription] = useState('');
  const [desiredResolution, setDesiredResolution] = useState<OrderIssueDesiredResolution>('EXCHANGE');
  const [images, setImages] = useState<Array<{ uri: string; name: string; type: string }>>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { createOrderIssueAsync, isPending } = useCreateOrderIssue();

  const handlePickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.8,
      });

      if (!res.canceled && res.assets) {
        const newFiles = res.assets.map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName || `evidence_${Date.now()}_${idx}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        }));
        setImages((prev) => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập mô tả chi tiết tình trạng sản phẩm.');
      return;
    }

    setErrorMsg(null);

    try {
      const itemId = orderItem?.id || orderItem?.orderItemId || orderItem?.productId;
      await createOrderIssueAsync({
        orderId,
        orderItemId: itemId,
        reason,
        description: description.trim(),
        desiredResolution,
        evidenceImages: images,
      });

      Alert.alert(
        'Đã gửi yêu cầu',
        'Yêu cầu báo cáo sự cố của bạn đã được tiếp nhận. Đội ngũ FashionAI sẽ xem xét và phản hồi trong vòng 24h làm việc.',
        [
          {
            text: 'Đồng ý',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.');
    }
  };

  if (!visible || !orderItem) return null;

  const itemName = orderItem.productName || orderItem.product?.name || 'Sản phẩm';
  const itemColor = orderItem.color || 'Mặc định';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface-lowest">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-surface-line bg-surface">
          <View className="flex-row items-center gap-2">
            <AlertTriangle size={20} color="#D97706" />
            <Text className="text-headline-sm font-bold text-on-surface">Báo cáo sự cố sản phẩm</Text>
          </View>
          <Pressable
            onPress={onClose}
            disabled={isPending}
            className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-line"
          >
            <X size={20} color="#1A1A1A" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Item Preview */}
          <View className="p-3.5 bg-surface border border-surface-line rounded-xl mb-5 flex-row items-center gap-3">
            <View className="w-12 h-14 bg-surface-line rounded-lg overflow-hidden shrink-0">
              {orderItem.imageUrl || orderItem.product?.images ? (
                <Image
                  source={{ uri: orderItem.imageUrl || (typeof orderItem.product?.images === 'string' ? JSON.parse(orderItem.product.images)[0] : orderItem.product?.images?.[0]) }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-bold text-on-surface" numberOfLines={1}>
                {itemName}
              </Text>
              <Text className="text-label-sm text-on-surface-variant mt-0.5">
                Màu sắc: {itemColor} • Số lượng: {orderItem.quantity || 1}
              </Text>
            </View>
          </View>

          {/* Reason Selection */}
          <Text className="text-label-md font-bold text-on-surface mb-2.5">
            1. Chọn vấn đề bạn gặp phải
          </Text>
          <View className="gap-2.5 mb-5">
            {REASONS.map((r) => {
              const selected = reason === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setReason(r.value)}
                  className={`p-3.5 rounded-xl border flex-row items-start gap-3 active:opacity-80 ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-surface-line bg-surface'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center mt-0.5 ${
                      selected ? 'border-primary bg-primary' : 'border-surface-line bg-surface'
                    }`}
                  >
                    {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-body-sm font-bold ${selected ? 'text-primary' : 'text-on-surface'}`}>
                      {r.label}
                    </Text>
                    <Text className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">
                      {r.desc}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Desired Resolution */}
          <Text className="text-label-md font-bold text-on-surface mb-2.5">
            2. Phương án mong muốn giải quyết
          </Text>
          <View className="gap-2.5 mb-5">
            {RESOLUTIONS.map((res) => {
              const selected = desiredResolution === res.value;
              return (
                <Pressable
                  key={res.value}
                  onPress={() => setDesiredResolution(res.value)}
                  className={`p-3.5 rounded-xl border flex-row items-start gap-3 active:opacity-80 ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-surface-line bg-surface'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center mt-0.5 ${
                      selected ? 'border-primary bg-primary' : 'border-surface-line bg-surface'
                    }`}
                  >
                    {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-body-sm font-bold ${selected ? 'text-primary' : 'text-on-surface'}`}>
                      {res.label}
                    </Text>
                    <Text className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">
                      {res.desc}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Description */}
          <Text className="text-label-md font-bold text-on-surface mb-2">
            3. Mô tả chi tiết vấn đề
          </Text>
          <TextInput
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Ví dụ: Vòng eo bị chật hơn 3cm so với số đo, đường may gấu áo bị bung chỉ..."
            placeholderTextColor="#A3A3A3"
            multiline
            numberOfLines={4}
            className="p-3.5 bg-surface border border-surface-line rounded-xl text-body-md text-on-surface min-h-[100px] mb-5 text-top"
            textAlignVertical="top"
          />

          {/* Evidence Photos */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text className="text-label-md font-bold text-on-surface">
              4. Ảnh minh chứng ({images.length}/5)
            </Text>
            {images.length < 5 && (
              <Pressable
                onPress={handlePickImages}
                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg active:opacity-70"
              >
                <ImagePlus size={15} color="#5D1C34" />
                <Text className="text-primary font-semibold text-label-sm">Thêm ảnh</Text>
              </Pressable>
            )}
          </View>

          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row gap-3">
              {images.map((img, idx) => (
                <View key={idx} className="relative w-20 h-24 rounded-xl border border-surface-line overflow-hidden mr-3">
                  <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  <Pressable
                    onPress={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center active:bg-black"
                  >
                    <Trash2 size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Pressable
              onPress={handlePickImages}
              className="p-5 border border-dashed border-surface-line rounded-xl bg-surface items-center justify-center mb-6 active:bg-surface-line/20"
            >
              <ImagePlus size={24} color="#737373" />
              <Text className="text-body-sm text-on-surface-variant font-medium mt-1.5">
                Chụp hoặc chọn ảnh thực tế sản phẩm lỗi
              </Text>
              <Text className="text-[11px] text-on-surface-variant/70 mt-0.5">Tối đa 5 hình ảnh (JPG, PNG)</Text>
            </Pressable>
          )}

          {errorMsg && (
            <View className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
              <Text className="text-body-sm text-red-600 font-medium text-center">{errorMsg}</Text>
            </View>
          )}

          {/* Submit CTA */}
          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            className={`w-full min-h-[52px] rounded-xl flex-row items-center justify-center gap-2 mb-4 ${
              isPending ? 'bg-primary/60' : 'bg-primary active:opacity-90'
            }`}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-bold text-label-lg">Gửi yêu cầu hỗ trợ</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
