import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

// Segmented control theo design-system: track surfaceContainer,
// mục active nền burgundy chữ trắng.
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
}) => (
  <View className="flex-row rounded-lg bg-surface-container p-xs">
    {options.map((option) => {
      const selected = value === option.value;
      return (
        <Pressable
          key={option.value}
          className={`min-h-11 flex-1 items-center justify-center rounded-md ${
            selected ? 'bg-primary-container' : ''
          }`}
          onPress={() => onChange(option.value)}
        >
          <Text
            className={`text-label-lg ${
              selected ? 'text-primary-foreground' : 'text-on-surface-variant'
            }`}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default SegmentedControl;
