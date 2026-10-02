import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import type { ReviewRating } from '../types/review';

const OPTIONS: { label: string; value?: ReviewRating }[] = [
  { label: 'Tất cả' },
  { label: '5 ★', value: 5 },
  { label: '4 ★', value: 4 },
  { label: '3 ★', value: 3 },
  { label: '2 ★', value: 2 },
  { label: '1 ★', value: 1 },
];

interface RatingFilterProps {
  value?: ReviewRating;
  onChange: (rating?: ReviewRating) => void;
}

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-sm px-lg"
      accessibilityRole="tablist"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={selected
              ? 'min-h-11 shrink-0 justify-center rounded-full bg-primary-container px-lg'
              : 'min-h-11 shrink-0 justify-center rounded-full border border-outline-variant bg-surface-lowest px-lg'}
            onPress={() => onChange(option.value)}
          >
            <Text
              numberOfLines={1}
              className={selected ? 'text-label-lg text-on-primary' : 'text-label-lg text-on-surface'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
