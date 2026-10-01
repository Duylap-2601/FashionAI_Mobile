import React, { useRef } from 'react';
import { View, Text, TextInput } from 'react-native';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
}

const boxStyle = tva({
  base: 'min-h-11 w-11 items-center justify-center rounded-md border border-surface-line bg-surface-low text-center text-headline-sm text-on-surface',
  variants: {
    error: {
      true: 'border-danger bg-danger-soft',
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
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(''));
  };

  const handleChangeText = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      setDigit(index - 1, '');
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View>
      <View className="flex-row justify-center gap-md">
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
            className={boxStyle({ error: !!error })}
          />
        ))}
      </View>
      {error ? (
        <Text className="mt-xs text-center text-body-sm text-danger">{error}</Text>
      ) : null}
    </View>
  );
};

export default OtpInput;
