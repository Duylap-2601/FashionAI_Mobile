import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface QuickChipsProps {
  title?: string;
  items: string[];
  selected?: string;
  disabled?: boolean;
  onSelect: (item: string) => void;
}

// Chip vuông 2px viền mảnh như gợi ý nhanh của web; chip đang chọn tô đỏ đô (không dùng pill).
export const QuickChips: React.FC<QuickChipsProps> = ({
  title,
  items,
  selected,
  disabled,
  onSelect,
}) => (
  <View>
    {title ? (
      <Text className="mb-sm font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
        {title}
      </Text>
    ) : null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-sm pr-xl">
        {items.map((item) => {
          const isSelected = selected === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={item}
              accessibilityState={{ selected: isSelected, disabled: !!disabled }}
              disabled={disabled}
              onPress={() => onSelect(item)}
              className={`min-h-11 items-center justify-center rounded-subtle border px-3.5 active:opacity-80 ${
                isSelected ? 'border-oxblood bg-oxblood' : 'border-landing-line bg-ivory'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              <Text
                className={`font-sans text-[13px] ${
                  isSelected ? 'text-landing-paper' : 'text-landing-obsidian/80'
                }`}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  </View>
);

export default QuickChips;
