import React, { useEffect, useRef, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

function getIconStyle(type: FeedbackModalType) {
  switch (type) {
    case 'success':
      return {
        bgClass: 'bg-success/15',
        iconName: 'checkmark-circle' as const,
        iconColorClass: 'text-success',
      };
    case 'error':
      return {
        bgClass: 'bg-danger/15',
        iconName: 'alert-circle' as const,
        iconColorClass: 'text-danger',
      };
    case 'warning':
      return {
        bgClass: 'bg-warning/15',
        iconName: 'alert-circle-outline' as const,
        iconColorClass: 'text-warning',
      };
    case 'info':
    default:
      return {
        bgClass: 'bg-primary-soft',
        iconName: 'information-circle-outline' as const,
        iconColorClass: 'text-primary-container',
      };
  }
}

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
  onAutoCloseRef.current = onAutoClose;

  useEffect(() => {
    if (!visible || !autoCloseSeconds || autoCloseSeconds <= 0) {
      return;
    }

    setCountdown(autoCloseSeconds);

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
        <View
          className={`mb-lg h-16 w-16 items-center justify-center rounded-full ${
            iconBgClassName ?? 'bg-surface-low'
          }`}
        >
          {customIcon}
        </View>
      );
    }

    const { bgClass, iconName, iconColorClass } = getIconStyle(type);

    return (
      <View className={`mb-lg h-16 w-16 items-center justify-center rounded-full ${bgClass}`}>
        <Ionicons name={iconName} size={36} className={iconColorClass} />
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
        <View className="flex-1 items-center justify-center bg-black/50 px-xl">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-sm items-center rounded-xxl border border-surface-line bg-surface-lowest p-xxl shadow-lg">
              {renderIcon()}

              <Text className="mb-xs text-center font-heading text-headline-sm font-bold text-on-surface-strong">
                {title}
              </Text>

              {message ? (
                <Text className="mb-md text-center font-body text-body-md leading-relaxed text-on-surface-variant">
                  {message}
                </Text>
              ) : null}

              {children}

              {autoCloseSeconds && countdown > 0 ? (
                <View className="mb-xl flex-row items-center rounded-full border border-surface-line bg-surface-low px-md py-xs">
                  <Ionicons name="time-outline" size={15} className="text-primary-container" />
                  <Text className="ml-xs text-body-sm font-semibold text-primary-container">
                    {countdownPrefix
                      ? `${countdownPrefix} ${countdown}s...`
                      : `Tự động chuyển sau ${countdown}s...`}
                  </Text>
                </View>
              ) : null}

              {secondaryButtonText ? (
                <View className="mt-md w-full flex-row gap-md">
                  <View className="flex-1">
                    <Button
                      title={secondaryButtonText}
                      variant={secondaryButtonVariant}
                      onPress={onSecondaryPress ?? onClose ?? (() => {})}
                      disabled={secondaryButtonDisabled || primaryButtonLoading}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title={primaryButtonText}
                      variant={resolvedPrimaryVariant}
                      onPress={onPrimaryPress ?? (() => {})}
                      loading={primaryButtonLoading}
                      textClassName="text-primary-foreground"
                    />
                  </View>
                </View>
              ) : (
<View className="mt-md w-full">
                    <Button
                      title={primaryButtonText}
                      variant={resolvedPrimaryVariant}
                      onPress={onPrimaryPress ?? (() => {})}
                      loading={primaryButtonLoading}
                      textClassName="text-primary-foreground"
                    />
                  </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

export default FeedbackModal;
