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

/** Tab chữ gạch chân như bộ lọc sao của FE RatingOverview, không dùng pill. */
export function RatingFilter({ value, onChange, stats }: RatingFilterProps) {
  return (
    <View className="flex-row flex-wrap gap-x-5" accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        const count = stats
          ? option.value
            ? stats.distribution[option.value]
            : stats.reviewCount
          : null;

        return (
          <Pressable
            key={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={count === null ? option.label : `${option.label}, ${count} đánh giá`}
            className="min-h-11 justify-center active:opacity-70"
            onPress={() => onChange(option.value)}
          >
            <View
              className={`flex-row items-center gap-1.5 border-b-2 pb-1 ${
                selected ? 'border-oxblood' : 'border-transparent'
              }`}
            >
              <Text
                numberOfLines={1}
                className={`font-sans text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  selected ? 'text-landing-oxblood' : 'text-landing-muted'
                }`}
              >
                {option.label}
              </Text>
              {count !== null ? (
                <Text
                  className={`font-mono text-[10px] ${
                    selected ? 'text-landing-oxblood/70' : 'text-landing-muted'
                  }`}
                >
                  ({count})
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
