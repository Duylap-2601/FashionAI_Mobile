import React from 'react';
import { Text } from 'react-native';
import { COLORS } from '@/constants/theme';

const SIZE_MAP = {
  sm: { fontSize: 18, lineHeight: 22 },
  md: { fontSize: 22, lineHeight: 26 },
  lg: { fontSize: 28, lineHeight: 32 },
} as const;

interface IWordmarkProps {
  size?: keyof typeof SIZE_MAP;
  variant?: 'dark' | 'light';
}

export const Wordmark: React.FC<IWordmarkProps> = ({ size = 'md', variant = 'dark' }) => {
  const { fontSize, lineHeight } = SIZE_MAP[size];
  const color = variant === 'light' ? COLORS.paper : COLORS.primaryContainer;

  return (
    <Text
      style={{
        fontFamily: 'Playfair Display',
        fontWeight: '700',
        fontSize,
        lineHeight,
        color,
        letterSpacing: -0.5,
      }}
    >
      St<Text style={{ fontWeight: '800' }}>A</Text>ie.
    </Text>
  );
};

export default Wordmark;
