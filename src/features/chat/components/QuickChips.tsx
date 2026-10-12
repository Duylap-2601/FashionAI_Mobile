import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface QuickChipsProps {
  title?: string;
  items: string[];
  selected?: string;
  disabled?: boolean;
  onSelect: (item: string) => void;
}

export const QuickChips: React.FC<QuickChipsProps> = ({
  title,
  items,
  selected,
  disabled,
  onSelect,
}) => (
  <View>
    {title ? (
      <Text className="mb-sm text-body-sm font-semibold text-on-surface">{title}</Text>
    ) : null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-sm pr-xl">
        {items.map((item) => {
          const isSelected = selected === item;
          return (
            <Pressable
              key={item}
              accessibilityLabel={item}
              disabled={disabled}
              onPress={() => onSelect(item)}
              className={`min-h-11 items-center justify-center rounded-full border px-md ${
                isSelected
                  ? 'border-primary-container bg-primary-container'
                  : 'border-outline-variant bg-surface-lowest'
              }`}
            >
              <Text
                className={`text-label-lg ${
                  isSelected ? 'text-primary-foreground' : 'text-on-surface'
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
