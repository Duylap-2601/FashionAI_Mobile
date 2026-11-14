import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

export type CheckoutProvider = 'ZALOPAY' | 'SEPAY';

const OPTIONS: { value: CheckoutProvider; label: string; description: string }[] = [
  {
    value: 'ZALOPAY',
    label: 'ZaloPay',
    description: 'Quét QR hoặc mở ZaloPay để thanh toán.',
  },
  {
    value: 'SEPAY',
    label: 'Chuyển khoản (SePay)',
    description: 'Quét QR hoặc mở cổng SePay để chuyển khoản.',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  total: number;
  isPending: boolean;
  initialProvider?: CheckoutProvider;
  onConfirm: (provider: CheckoutProvider) => void;
}

/** Chọn lại cổng thanh toán cho đơn chưa trả tiền (giống OrderPaymentAction của web). */
export function PaymentMethodSheet({
  visible,
  onClose,
  total,
  isPending,
  initialProvider = 'ZALOPAY',
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => {
        if (!isPending) onClose();
      }}
    >
      {visible ? (
        <PaymentMethodContent
          onClose={onClose}
          total={total}
          isPending={isPending}
          initialProvider={initialProvider}
          onConfirm={onConfirm}
        />
      ) : null}
    </Modal>
  );
}

function PaymentMethodContent({
  onClose,
  total,
  isPending,
  initialProvider,
  onConfirm,
}: {
  onClose: () => void;
  total: number;
  isPending: boolean;
  initialProvider: CheckoutProvider;
  onConfirm: (provider: CheckoutProvider) => void;
}) {
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<CheckoutProvider>(initialProvider);

  return (
    <View className="flex-1 justify-end">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng chọn thanh toán"
        onPress={() => {
          if (!isPending) onClose();
        }}
        className="absolute inset-0 bg-landing-obsidian/45"
      />

      <View
        className="w-full max-w-[420px] self-center border-t border-landing-line bg-landing-paper px-5 pt-5"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
              Thanh toán
            </Text>
            <Text
              accessibilityRole="header"
              className="font-display text-[24px] leading-tight text-landing-obsidian"
            >
              Chọn cách thanh toán
            </Text>
            <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
              Đơn được xác nhận ngay khi cổng báo đã nhận tiền.
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

        <View accessibilityRole="radiogroup" className="mt-4 gap-2">
          {OPTIONS.map((option) => {
            const selected = provider === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
                disabled={isPending}
                onPress={() => setProvider(option.value)}
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
                    className={`h-4 w-4 items-center justify-center rounded-full border ${
                      selected ? 'border-oxblood bg-oxblood' : 'border-taupe'
                    }`}
                  >
                    {selected ? <Check size={10} strokeWidth={3} color={COLORS.paper} /> : null}
                  </View>
                </View>
                <Text className="font-sans text-[12px] leading-relaxed text-landing-muted">
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4 flex-row items-baseline justify-between gap-4 border-t border-landing-line pt-4">
          <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brass-ink">
            Số tiền
          </Text>
          <Text className="font-mono text-[20px] text-oxblood">{formatCurrency(total)}</Text>
        </View>

        <View className="mt-5 gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tiếp tục thanh toán"
            accessibilityState={{ disabled: isPending }}
            disabled={isPending}
            onPress={() => onConfirm(provider)}
            className="h-11 flex-row items-center justify-center gap-2 rounded-subtle bg-oxblood active:opacity-90 disabled:opacity-60"
          >
            {isPending ? <ActivityIndicator size="small" color={COLORS.paper} /> : null}
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-paper">
              {isPending ? 'Đang tạo thanh toán' : 'Tiếp tục thanh toán'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Để sau"
            disabled={isPending}
            onPress={onClose}
            className="h-11 items-center justify-center rounded-subtle border border-landing-line active:opacity-70"
          >
            <Text className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-landing-obsidian">
              Để sau
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
