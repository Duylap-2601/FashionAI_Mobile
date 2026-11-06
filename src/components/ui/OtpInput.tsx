import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
}

const EMPTY_CHAR = '\u200B';

// Ô OTP theo Input của design/DESIGN.md: góc 2px, nền ivory, viền hairline, viền oxblood khi đang
// nhập, viền danger khi lỗi. Chữ số dùng mono (mã). Cỡ chữ tuyệt đối vì tailwind-merge trong tva
// coi token `text-headline-*` là màu chữ.
const boxStyle = tva({
  base: 'h-14 w-12 items-center justify-center rounded-subtle border border-landing-line bg-landing-ivory/80 text-center font-mono text-[24px] text-landing-obsidian',
  variants: {
    focused: {
      true: 'border-oxblood',
    },
    error: {
      true: 'border-danger',
    },
  },
});

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  value,
  onChange,
  error,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const valueRef = useRef(value);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const lastBackspaceTimeRef = useRef(0);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const digits = Array.from(
    { length },
    (_, index) => value[index] ?? '',
  );

  const updateCode = useCallback(
    (newCode: string) => {
      valueRef.current = newCode;
      onChange(newCode);
    },
    [onChange],
  );

  const focusInput = useCallback(
    (index: number) => {
      if (index >= 0 && index < length) {
        inputRefs.current[index]?.focus();
      }
    },
    [length],
  );

  const handleBackspace = useCallback(
    (index: number) => {
      const now = Date.now();
      // Chống duplicate event giữa onKeyPress và onChangeText trong vòng 80ms
      if (now - lastBackspaceTimeRef.current < 80) {
        return;
      }
      lastBackspaceTimeRef.current = now;

      const currentCode = valueRef.current;
      const currentDigits = Array.from(
        { length },
        (_, i) => currentCode[i] ?? '',
      );

      // Nếu ô hiện tại đang có số:
      // chỉ xóa số, vẫn giữ focus tại ô hiện tại.
      if (currentDigits[index]) {
        const next = [...currentDigits];
        next[index] = '';
        updateCode(next.join(''));
        return;
      }

      // Nếu ô hiện tại đã trống:
      // xóa ô trước + focus về ô trước.
      if (index > 0) {
        const next = [...currentDigits];
        next[index - 1] = '';
        updateCode(next.join(''));
        requestAnimationFrame(() => {
          focusInput(index - 1);
        });
      }
    },
    [focusInput, length, updateCode],
  );

  const handleChangeText = useCallback(
    (text: string, index: number) => {
      // Khi text rỗng -> người dùng đã nhấn xóa (Backspace) trên thiết bị/bàn phím
      if (text.length === 0) {
        handleBackspace(index);
        return;
      }

      // Chỉ lấy số
      const numbers = text.replace(/[^0-9]/g, '');

      // Nếu không có số nào (ví dụ nhập ký tự chữ), bỏ qua
      if (numbers.length === 0) {
        return;
      }

      // Trường hợp paste cả OTP, ví dụ "1234"
      if (numbers.length > 1) {
        const pastedCode = numbers.slice(0, length);
        updateCode(pastedCode);

        const nextIndex = Math.min(pastedCode.length, length - 1);
        requestAnimationFrame(() => {
          focusInput(nextIndex);
        });
        return;
      }

      // Nhập 1 chữ số
      const digit = numbers;
      const currentCode = valueRef.current;
      const next = Array.from(
        { length },
        (_, i) => currentCode[i] ?? '',
      );
      next[index] = digit;
      updateCode(next.join(''));

      // Nhập xong thì tự động sang ô tiếp theo
      if (index < length - 1) {
        requestAnimationFrame(() => {
          focusInput(index + 1);
        });
      }
    },
    [focusInput, handleBackspace, length, updateCode],
  );

  const handleKeyPress = useCallback(
    (
      e: NativeSyntheticEvent<TextInputKeyPressEventData>,
      index: number,
    ) => {
      if (e.nativeEvent.key === 'Backspace') {
        handleBackspace(index);
      }
    },
    [handleBackspace],
  );

  useEffect(() => {
    if (autoFocus && value.length === 0) {
      requestAnimationFrame(() => {
        focusInput(0);
      });
    }
  }, [autoFocus, focusInput, value.length]);

  return (
    <View>
      <View className="flex-row justify-center gap-md">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit !== '' ? digit : EMPTY_CHAR}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() =>
              setFocusedIndex((current) => (current === index ? null : current))
            }
            accessibilityLabel={`Chữ số ${index + 1} của mã xác thực`}
            keyboardType="number-pad"
            inputMode="numeric"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={length}
            autoFocus={autoFocus && index === 0}
            selectTextOnFocus
            className={boxStyle({ focused: focusedIndex === index, error: !!error })}
          />
        ))}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-sm text-center font-sans text-body-sm text-danger"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default OtpInput;