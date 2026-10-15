import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { IReviewStats, ReviewRating } from '../types/review';

const OPTIONS: { label: string; value?: ReviewRating }[] = [
  { label: 'Tất cả' },
  { label: '5 sao', value: 5 },
  { label: '4 sao', value: 4 },
  { label: '3 sao', value: 3 },
  { label: '2 sao', value: 2 },
  { label: '1 sao', value: 1 },
];

interface RatingFilterProps {
  value?: ReviewRating;
  onChange: (rating?: ReviewRating) => void;
  stats?: IReviewStats;
}

export function RatingFilter({ value, onChange, stats }: RatingFilterProps) {
  return (
    <View className="flex-row flex-wrap gap-sm" accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={selected
              ? 'min-h-11 min-w-11 flex-row items-center justify-center gap-xs rounded-xl bg-primary-container px-md'
              : 'min-h-11 min-w-11 flex-row items-center justify-center gap-xs rounded-xl border border-catalog-line bg-surface-lowest px-md'}
            onPress={() => onChange(option.value)}
          >
            <Text
              numberOfLines={1}
              className={selected ? 'font-sans text-body-sm font-medium text-on-primary' : 'font-sans text-body-sm font-medium text-on-surface-variant'}
            >
              {option.label}
            </Text>
            {stats ? (
              <Text className={selected ? 'font-sans text-body-sm text-on-primary/80' : 'font-sans text-body-sm text-catalog-muted-text'}>
                ({option.value ? stats.distribution[option.value] : stats.reviewCount})
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
