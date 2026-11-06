import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Trash2, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useCreateOrderIssue } from '../hooks/use-orders';
import type { IEvidenceImage, IRefundBankAccount, OrderIssueReason } from '../types/order';
import { getOrderItemImage, getOrderItemName, type OrderItemLike } from '../utils/order-items';
import {
  ISSUE_DESCRIPTION_MAX,
  ISSUE_DESCRIPTION_MIN,
  MAX_EVIDENCE_IMAGES,
  validateIssueForm,
} from '../utils/order-returns';

export type ReportIssueMode = 'PRODUCT' | 'REFUND_NOT_RECEIVED';

export interface ReportableOrderItem extends OrderItemLike {
  id?: string | number;
  orderItemId?: string | number;
  color?: string | null;
  quantity?: number | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  orderId: string | number;
  orderItem: ReportableOrderItem | null;
  /** REFUND_NOT_RECEIVED: báo chưa nhận được tiền hoàn sau khi shop đã chuyển. */
  mode?: ReportIssueMode;
  /** Tài khoản đã dùng ở đơn này, điền sẵn cho khách. */
  defaultBank?: Partial<Record<keyof IRefundBankAccount, string | null>>;
  onSuccess?: () => void;
}

const REASONS: { value: OrderIssueReason; label: string; desc: string }[] = [
  {
    value: 'WRONG_SIZE',
    label: 'Sai kích thước / số đo',
    desc: 'Sản phẩm may không khớp với thông số số đo đã đặt.',
  },
  {
    value: 'WRONG_COLOR',
    label: 'Sai màu / sai mẫu',
    desc: 'Nhận màu hoặc mẫu khác với lựa chọn khi đặt hàng.',
  },
  {
    value: 'QUALITY_MISMATCH',
    label: 'Lỗi đường may / Chất lượng vải',
    desc: 'Sản phẩm bị lỗi vải, rách, đường chỉ lỗi hoặc kém chất lượng.',
  },
  {
    value: 'OTHER',
    label: 'Lý do khác',
    desc: 'Vấn đề phát sinh khác (sẽ được shop xem xét riêng).',
  },
];

// expo-image không nhận className (chưa cssInterop), nên ảnh lấp khung dùng style.
const FILL_IMAGE_STYLE = { width: '100%', height: '100%' } as const;
const LABEL_CLASS = 'font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink';
const INPUT_CLASS =
  'h-11 rounded-subtle border border-landing-line bg-landing-ivory px-3 font-sans text-[13px] text-landing-obsidian';

export function ReportIssueModal({ visible, onClose, orderId, orderItem, mode = 'PRODUCT', defaultBank, onSuccess }: Props) {
  return (
    <Modal visible={visible && !!orderItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* Form chỉ mount khi mở nên mỗi lần mở là một form mới, không cần reset trong effect. */}
      {visible && orderItem ? (
        <ReportIssueForm
          onClose={onClose}
          orderId={orderId}
          orderItem={orderItem}
          mode={mode}
          defaultBank={defaultBank}
          onSuccess={onSuccess}
        />
      ) : null}
    </Modal>
  );
}

function ReportIssueForm({
  onClose,
  orderId,
  orderItem,
  mode,
  defaultBank,
  onSuccess,
}: Omit<Props, 'visible' | 'orderItem' | 'mode'> & { orderItem: ReportableOrderItem; mode: ReportIssueMode }) {
  const isRefundMode = mode === 'REFUND_NOT_RECEIVED';
  const [reason, setReason] = useState<OrderIssueReason>(isRefundMode ? 'REFUND_NOT_RECEIVED' : 'WRONG_SIZE');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<IEvidenceImage[]>([]);
  const [bankName, setBankName] = useState(defaultBank?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(defaultBank?.accountNumber ?? '');
  const [accountHolder, setAccountHolder] = useState(defaultBank?.accountHolder ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { createOrderIssueAsync, isPending } = useCreateOrderIssue();
  const descriptionLength = description.trim().length;
  const canAddImages = images.length < MAX_EVIDENCE_IMAGES;

  const handlePickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_EVIDENCE_IMAGES - images.length,
        quality: 0.8,
      });

      if (!res.canceled && res.assets) {
        const picked = res.assets.map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName || `evidence_${Date.now()}_${idx}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        }));
        setErrorMsg(null);
        setImages((prev) => [...prev, ...picked].slice(0, MAX_EVIDENCE_IMAGES));
      }
    } catch {
      Alert.alert('Không mở được thư viện ảnh', 'Vui lòng kiểm tra quyền truy cập ảnh rồi thử lại.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validationError = validateIssueForm({
      description,
      imageCount: images.length,
      bankName,
      accountNumber,
      accountHolder,
      isRefundMode,
    });
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    const orderItemId = orderItem.id ?? orderItem.orderItemId;
    if (orderItemId === undefined || orderItemId === null) {
      setErrorMsg('Không xác định được sản phẩm cần báo lỗi. Vui lòng tải lại đơn hàng.');
      return;
    }

    setErrorMsg(null);
    try {
      await createOrderIssueAsync({
        orderId,
        orderItemId,
        reason,
        description: description.trim(),
        evidenceImages: images,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });

      Alert.alert(
        'Đã gửi yêu cầu',
        isRefundMode
          ? 'Đã gửi báo cáo chưa nhận được tiền hoàn. Shop sẽ kiểm tra và phản hồi sớm nhất.'
          : 'Yêu cầu báo lỗi sản phẩm đã được gửi. Đội ngũ FashionAI sẽ xem xét sớm nhất.',
        [
          {
            text: 'Đồng ý',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ],
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error && err.message ? err.message : 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.',
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-landing-paper">
      <View className="flex-row items-start justify-between gap-3 border-b border-landing-line px-5 pb-4 pt-5">
        <View className="flex-1 gap-1">
          <Text className={LABEL_CLASS}>{isRefundMode ? 'Hoàn tiền' : 'Báo lỗi sản phẩm'}</Text>
          <Text accessibilityRole="header" className="font-display text-[24px] leading-tight text-landing-obsidian">
            {isRefundMode ? 'Chưa nhận được tiền hoàn' : 'Yêu cầu xử lý'}
          </Text>
          <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
            {isRefundMode
              ? 'Dùng khi shop đã ghi nhận hoàn tiền trong 7 ngày qua mà bạn chưa nhận được.'
              : 'Áp dụng cho đơn đã hoàn tất trong vòng 7 ngày.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          accessibilityState={{ disabled: isPending }}
          disabled={isPending}
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
        <View className="flex-row items-center gap-3 border-b border-landing-line pb-5">
          <View className="h-16 w-12 overflow-hidden rounded-subtle border border-landing-line bg-ivory">
            <Image source={{ uri: getOrderItemImage(orderItem) }} style={FILL_IMAGE_STYLE} contentFit="cover" />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-sans text-[13px] text-landing-obsidian">
              {getOrderItemName(orderItem)}
            </Text>
            <Text className="font-sans text-[11.5px] text-landing-muted">
              Màu: {orderItem.color || 'Mặc định'} · SL{' '}
              <Text className="font-mono">{orderItem.quantity || 1}</Text>
            </Text>
          </View>
        </View>

        {errorMsg ? (
          <View accessibilityRole="alert" className="border-l-2 border-danger bg-landing-ivory px-3 py-2">
            <Text className="font-sans text-[13px] leading-relaxed text-danger">{errorMsg}</Text>
          </View>
        ) : null}

        {isRefundMode ? (
          <View className="border-l-2 border-landing-brass bg-landing-ivory px-3 py-2.5">
            <Text className="font-sans text-[13px] font-medium text-landing-obsidian">
              Lý do: chưa nhận được tiền hoàn
            </Text>
            <Text className="mt-1 font-sans text-[12px] leading-relaxed text-landing-muted">
              Vui lòng kiểm tra sao kê ngân hàng trước khi gửi. Shop sẽ đối chiếu lại giao dịch và chuyển lại nếu tiền
              chưa tới tài khoản của bạn.
            </Text>
          </View>
        ) : (
          <View>
            <Text className={LABEL_CLASS}>
              Lý do báo lỗi <Text className="text-danger">*</Text>
            </Text>
            <View accessibilityRole="radiogroup" className="mt-3 gap-2">
              {REASONS.map((option) => {
                const selected = reason === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option.label}
                    onPress={() => setReason(option.value)}
                    className={`min-h-11 gap-1 rounded-subtle border px-3 py-2.5 active:opacity-80 ${
                      selected ? 'border-oxblood bg-landing-ivory' : 'border-landing-line bg-landing-ivory/50'
                    }`}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <Text
                        className={`flex-1 font-sans text-[13px] ${
                          selected ? 'font-medium text-oxblood' : 'text-landing-obsidian'
                        }`}
                      >
                        {option.label}
                      </Text>
                      <View
                        className={`h-3.5 w-3.5 items-center justify-center rounded-full border ${
                          selected ? 'border-oxblood' : 'border-taupe'
                        }`}
                      >
                        {selected ? <View className="h-1.5 w-1.5 rounded-full bg-oxblood" /> : null}
                      </View>
                    </View>
                    <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">{option.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
            {reason === 'OTHER' ? (
              <Text className="mt-3 border-l-2 border-landing-brass pl-3 font-sans text-[12px] leading-relaxed text-brass-ink">
                Yêu cầu vì lý do khác cần bộ phận chăm sóc khách hàng thẩm định riêng và có thể không được chấp thuận.
              </Text>
            ) : null}
          </View>
        )}

        <View>
          <Text className={LABEL_CLASS}>Hướng xử lý</Text>
          <Text className="mt-2 font-sans text-[13px] font-medium text-landing-obsidian">Hoàn tiền</Text>
          <Text className="mt-0.5 font-sans text-[12px] leading-relaxed text-landing-muted">
            {isRefundMode
              ? 'Shop đối chiếu lại giao dịch và chuyển lại tiền vào tài khoản của bạn nếu chưa nhận được.'
              : 'Shop hoàn tiền về tài khoản ngân hàng của bạn sau khi nhận lại và kiểm tra hàng hoàn.'}
          </Text>
        </View>

        <View>
          <Text className={LABEL_CLASS}>
            {isRefundMode ? 'Tài khoản nhận lại tiền hoàn' : 'Tài khoản nhận hoàn tiền'}{' '}
            <Text className="text-danger">*</Text>
          </Text>
          <View className="mt-3 gap-2.5">
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="Ngân hàng (VD: Vietcombank)"
              placeholderTextColor={COLORS.muted}
              accessibilityLabel="Tên ngân hàng"
              autoCapitalize="words"
              className={INPUT_CLASS}
            />
            <TextInput
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/\s/g, ''))}
              placeholder="Số tài khoản"
              placeholderTextColor={COLORS.muted}
              accessibilityLabel="Số tài khoản"
              keyboardType="number-pad"
              className={`${INPUT_CLASS} font-mono`}
            />
            <TextInput
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder="Tên chủ tài khoản (không dấu)"
              placeholderTextColor={COLORS.muted}
              accessibilityLabel="Tên chủ tài khoản"
              autoCapitalize="characters"
              className={INPUT_CLASS}
            />
          </View>
          <Text className="mt-2 font-sans text-[12px] leading-relaxed text-landing-muted">
            {isRefundMode
              ? 'Kiểm tra kỹ số tài khoản. Shop sẽ chuyển lại tiền vào đúng tài khoản này.'
              : 'Shop chuyển khoản hoàn tiền vào tài khoản này sau khi nhận và kiểm tra hàng hoàn.'}
          </Text>
        </View>

        <View>
          <View className="flex-row items-baseline justify-between gap-3">
            <Text className={LABEL_CLASS}>
              Mô tả chi tiết <Text className="text-danger">*</Text>
            </Text>
            <Text
              className={`font-mono text-[11px] ${
                descriptionLength < ISSUE_DESCRIPTION_MIN ? 'text-brass-ink' : 'text-landing-muted'
              }`}
            >
              {description.length}/{ISSUE_DESCRIPTION_MAX}
            </Text>
          </View>
          <TextInput
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={
              isRefundMode
                ? 'Ví dụ: đã kiểm tra sao kê Vietcombank từ 01/11 đến 03/11 nhưng chưa thấy khoản hoàn nào.'
                : 'Ví dụ: áo lệch vai trái khoảng 4cm so với số đo đã đặt, đường chỉ tay áo bị tuột.'
            }
            placeholderTextColor={COLORS.muted}
            accessibilityLabel="Mô tả chi tiết"
            maxLength={ISSUE_DESCRIPTION_MAX}
            multiline
            textAlignVertical="top"
            className="mt-2 min-h-[104px] rounded-subtle border border-landing-line bg-landing-ivory px-3 py-2.5 font-sans text-[13px] leading-relaxed text-landing-obsidian"
          />
          <Text className="mt-1.5 font-sans text-[12px] text-landing-muted">
            Tối thiểu {ISSUE_DESCRIPTION_MIN} ký tự.
          </Text>
        </View>

        <View>
          <Text className={LABEL_CLASS}>
            {isRefundMode ? 'Ảnh sao kê / chứng từ' : 'Ảnh minh chứng'} <Text className="text-danger">*</Text>{' '}
            <Text className="font-mono normal-case tracking-normal text-landing-muted">
              ({images.length}/{MAX_EVIDENCE_IMAGES})
            </Text>
          </Text>

          {images.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {images.map((img, idx) => (
                <View key={img.uri} className="h-20 w-16 overflow-hidden rounded-subtle border border-landing-line">
                  <Image source={{ uri: img.uri }} style={FILL_IMAGE_STYLE} contentFit="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ảnh ${idx + 1}`}
                    disabled={isPending}
                    onPress={() => handleRemoveImage(idx)}
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
                  disabled={isPending}
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
              accessibilityLabel={isRefundMode ? 'Tải lên ảnh sao kê' : 'Tải lên ảnh chụp lỗi thực tế'}
              disabled={isPending}
              onPress={handlePickImages}
              className="mt-3 items-center justify-center gap-2 rounded-subtle border border-dashed border-taupe bg-landing-ivory/50 px-4 py-6 active:opacity-70"
            >
              <ImagePlus size={20} strokeWidth={1.75} color={COLORS.muted} />
              <Text className="font-sans text-[13px] font-medium text-landing-muted">
                {isRefundMode ? 'Tải lên ảnh sao kê' : 'Tải lên ảnh chụp lỗi thực tế'}
              </Text>
              <Text className="font-sans text-[12px] text-landing-muted">
                Bắt buộc ít nhất 1 ảnh · tối đa {MAX_EVIDENCE_IMAGES} ảnh, mỗi ảnh dưới 10MB
              </Text>
            </Pressable>
          )}
        </View>

        <View className="gap-3 border-t border-landing-line pt-5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRefundMode ? 'Gửi báo cáo' : 'Gửi yêu cầu'}
            accessibilityState={{ disabled: isPending }}
            disabled={isPending}
            onPress={handleSubmit}
            className="h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90 disabled:opacity-60"
          >
            {isPending ? <ActivityIndicator size="small" color={COLORS.ivory} /> : null}
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              {isPending ? 'Đang gửi' : isRefundMode ? 'Gửi báo cáo' : 'Gửi yêu cầu'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hủy"
            disabled={isPending}
            onPress={onClose}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Hủy
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
