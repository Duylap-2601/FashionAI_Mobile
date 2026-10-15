import React from 'react';
import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { ReviewRating } from '../types/review';

const RATINGS: ReviewRating[] = [1, 2, 3, 4, 5];

interface RatingStarsProps {
  value: number;
  onChange?: (rating: ReviewRating) => void;
  size?: 'sm' | 'lg';
}

export function RatingStars({ value, onChange, size = 'sm' }: RatingStarsProps) {
  return (
    <View className="flex-row gap-xs" accessibilityLabel={`${value} trên 5 sao`}>
      {RATINGS.map((rating) => {
        const star = (
          <Star
            size={size === 'lg' ? 28 : 18}
            color={rating <= value ? COLORS.warning : COLORS.surfaceHighest}
            fill={rating <= value ? COLORS.warning : COLORS.surfaceHigh}
          />
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
          <View key={rating}>
            {star}
          </View>
        );
      })}
    </View>
  );
}
