import React from 'react';
import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { ReviewRating } from '../types/review';

const RATINGS: ReviewRating[] = [1, 2, 3, 4, 5];

// Same steps as FE StarRating SIZE_MAP (xs 12, sm 16, md 20, lg 24).
const STAR_SIZE = { xs: 12, sm: 16, md: 20, lg: 24 } as const;

interface RatingStarsProps {
  value: number;
  onChange?: (rating: ReviewRating) => void;
  size?: keyof typeof STAR_SIZE;
}

function formatRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Sao đánh giá theo FE StarRating tone="landing": sao đầy oxblood, sao trống viền taupe.
 * Giá trị thập phân (điểm trung bình) được làm tròn khi tô sao, nhãn đọc giữ một chữ số lẻ.
 */
export function RatingStars({ value, onChange, size = 'sm' }: RatingStarsProps) {
  const filled = Math.round(value);
  const starSize = STAR_SIZE[size];

  const renderStar = (rating: ReviewRating) => {
    const isFull = rating <= filled;
    return (
      <Star
        size={starSize}
        strokeWidth={1.75}
        color={isFull ? COLORS.oxblood : COLORS.taupe}
        fill={isFull ? COLORS.oxblood : 'transparent'}
      />
    );
  };

  if (onChange) {
    return (
      <View accessibilityRole="radiogroup" className="flex-row">
        {RATINGS.map((rating) => (
          <Pressable
            key={rating}
            accessibilityRole="radio"
            accessibilityLabel={`${rating} sao`}
            accessibilityState={{ checked: rating === filled }}
            className="min-h-11 min-w-11 items-center justify-center active:opacity-70"
            onPress={() => onChange(rating)}
          >
            {renderStar(rating)}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${formatRating(value)} trên 5 sao`}
      className="flex-row items-center gap-0.5"
    >
      {RATINGS.map((rating) => (
        <View key={rating}>{renderStar(rating)}</View>
      ))}
    </View>
  );
}
