import React, { useEffect, useRef, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { AlertCircle, CheckCircle2, Clock, Info, TriangleAlert } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { Button } from './Button';

export type FeedbackModalType = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackModalProps {
  visible: boolean;
  onClose?: () => void;
  type?: FeedbackModalType;
  customIcon?: React.ReactNode;
  iconBgClassName?: string;
  title: string;
  message?: string;
  children?: React.ReactNode;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  primaryButtonVariant?: 'primary' | 'danger' | 'secondary' | 'outline';
  primaryButtonLoading?: boolean;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  secondaryButtonVariant?: 'outline' | 'ghost' | 'secondary';
  secondaryButtonDisabled?: boolean;
  autoCloseSeconds?: number;
  onAutoClose?: () => void;
  countdownPrefix?: string;
  dismissible?: boolean;
}

// Màu theo khối thông báo của FE (auth-form AuthAlert): lỗi danger, lưu ý brass ink, thành công sage ink.
const TYPE_ICON: Record<FeedbackModalType, { Icon: LucideIcon; color: string }> = {
  success: { Icon: CheckCircle2, color: COLORS.sageInk },
  error: { Icon: AlertCircle, color: COLORS.danger },
  warning: { Icon: TriangleAlert, color: COLORS.brassInk },
  info: { Icon: Info, color: COLORS.brassInk },
};

const ICON_FRAME_CLASS = 'mb-lg h-16 w-16 items-center justify-center rounded-subtle border border-landing-line';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  type = 'info',
  customIcon,
  iconBgClassName,
  title,
  message,
  children,
  primaryButtonText = 'Đồng ý',
  onPrimaryPress,
  primaryButtonVariant,
  primaryButtonLoading = false,
  secondaryButtonText,
  onSecondaryPress,
  secondaryButtonVariant = 'outline',
  secondaryButtonDisabled = false,
  autoCloseSeconds,
  onAutoClose,
  countdownPrefix,
  dismissible = false,
}) => {
  const [countdown, setCountdown] = useState(autoCloseSeconds ?? 0);
  const onAutoCloseRef = useRef(onAutoClose);

  // Đặt lại bộ đếm ngay khi modal mở (hoặc đổi số giây) bằng mẫu "điều chỉnh state theo props"
  // của React, thay vì gọi setState đồng bộ trong effect.
  const [countdownKey, setCountdownKey] = useState({ visible, autoCloseSeconds });
  if (countdownKey.visible !== visible || countdownKey.autoCloseSeconds !== autoCloseSeconds) {
    setCountdownKey({ visible, autoCloseSeconds });
    if (visible && autoCloseSeconds && autoCloseSeconds > 0) {
      setCountdown(autoCloseSeconds);
    }
  }

  useEffect(() => {
    onAutoCloseRef.current = onAutoClose;
  }, [onAutoClose]);

  useEffect(() => {
    if (!visible || !autoCloseSeconds || autoCloseSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAutoCloseRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, autoCloseSeconds]);

  const renderIcon = () => {
    if (customIcon) {
      return (
        <View className={`${ICON_FRAME_CLASS} ${iconBgClassName ?? 'bg-landing-ivory'}`}>
          {customIcon}
        </View>
      );
    }

    const { Icon, color } = TYPE_ICON[type];

    return (
      <View className={`${ICON_FRAME_CLASS} bg-landing-ivory`}>
        <Icon size={28} strokeWidth={1.5} color={color} />
      </View>
    );
  };

  const resolvedPrimaryVariant =
    primaryButtonVariant ?? (type === 'error' ? 'danger' : 'primary');

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
    >
      <TouchableWithoutFeedback
        onPress={dismissible ? onClose : undefined}
      >
        <View className="flex-1 items-center justify-center bg-landing-obsidian/45 px-xl">
          <TouchableWithoutFeedback>
            <View
              accessibilityViewIsModal
              className="w-full max-w-sm items-center rounded-subtle border border-landing-line bg-landing-paper px-xxl py-xxxl"
            >
              {renderIcon()}

              <Text
                accessibilityRole="header"
                className="mb-sm text-center font-display text-[22px] leading-tight text-landing-obsidian"
              >
                {title}
              </Text>

              {message ? (
                <Text className="mb-md text-center font-sans text-body-md leading-relaxed text-landing-muted">
                  {message}
                </Text>
              ) : null}

              {children}

              {autoCloseSeconds && countdown > 0 ? (
                <View
                  accessibilityLiveRegion="polite"
                  className="mb-md mt-xs w-full flex-row items-center gap-sm border-l-2 border-landing-brass bg-landing-ivory px-md py-sm"
                >
                  <Clock size={14} strokeWidth={1.75} color={COLORS.brassInk} />
                  <Text className="flex-1 font-sans text-body-sm text-landing-obsidian">
                    {countdownPrefix ?? 'Tự động chuyển sau'}{' '}
                    <Text className="font-mono text-brass-ink">{countdown}s</Text>
                  </Text>
                </View>
              ) : null}

              {/* Nút xếp dọc như AccountConfirmDialog của FE trên màn hẹp: hành động chính ở trên. */}
              <View className="mt-md w-full gap-sm">
                <Button
                  title={primaryButtonText}
                  variant={resolvedPrimaryVariant}
                  size="lg"
                  onPress={onPrimaryPress ?? (() => {})}
                  loading={primaryButtonLoading}
                />
                {secondaryButtonText ? (
                  <Button
                    title={secondaryButtonText}
                    variant={secondaryButtonVariant}
                    size="lg"
                    onPress={onSecondaryPress ?? onClose ?? (() => {})}
                    disabled={secondaryButtonDisabled || primaryButtonLoading}
                  />
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

export default FeedbackModal;
