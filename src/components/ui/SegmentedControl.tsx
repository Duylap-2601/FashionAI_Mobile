import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

// design/DESIGN.md › SegmentedControl, FE TryOnSegmented: rãnh ivory viền hairline góc 2px,
// mục đang chọn nền oxblood chữ paper, mục còn lại trong suốt chữ obsidian nhạt. Cao tối thiểu 44px.
const segmentStyle = tva({
  base: 'min-h-11 flex-1 items-center justify-center rounded-subtle px-md active:opacity-80',
  variants: {
    selected: {
      true: 'bg-oxblood',
    },
  },
});

const segmentTextStyle = tva({
  base: 'font-sans text-[11px] font-semibold uppercase tracking-[0.14em]',
  variants: {
    selected: {
      true: 'text-landing-paper',
      false: 'text-landing-obsidian/70',
    },
  },
});

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
}) => (
  <View
    accessibilityRole="tablist"
    className="flex-row rounded-subtle border border-landing-line bg-landing-ivory p-xs"
  >
    {options.map((option) => {
      const selected = value === option.value;
      return (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          accessibilityLabel={option.label}
          className={segmentStyle({ selected })}
          onPress={() => onChange(option.value)}
        >
          <Text numberOfLines={1} className={segmentTextStyle({ selected })}>
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default SegmentedControl;
