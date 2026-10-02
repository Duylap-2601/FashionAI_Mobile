import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ReviewRating } from '../types/review';

const RATINGS: ReviewRating[] = [1, 2, 3, 4, 5];

interface RatingStarsProps {
  value: number;
  onChange?: (rating: ReviewRating) => void;
  size?: 'sm' | 'lg';
}

export function RatingStars({ value, onChange, size = 'sm' }: RatingStarsProps) {
  return (
    <View className="flex-row" accessibilityLabel={`${value} trên 5 sao`}>
      {RATINGS.map((rating) => {
        const star = (
          <Text
            className={size === 'lg' ? 'text-headline-lg text-warning' : 'text-headline-sm text-warning'}
          >
            {rating <= value ? '★' : '☆'}
          </Text>
        );

        return onChange ? (
          <Pressable
            key={rating}
            accessibilityRole="button"
            accessibilityLabel={`Chọn ${rating} sao`}
            className="min-h-11 min-w-11 items-center justify-center"
            onPress={() => onChange(rating)}
          >
            {star}
          </Pressable>
        ) : (
          <View key={rating} className="mr-xs">
            {star}
          </View>
        );
      })}
    </View>
  );
}
