import React from 'react';
import { Text } from 'react-native';
import { COLORS } from '@/constants/theme';

// Mirrors FE's Logo: leading-none (lineHeight = fontSize) and tracking-[-0.02em].
const SIZE_MAP = {
  sm: { fontSize: 18, lineHeight: 18 },
  md: { fontSize: 22, lineHeight: 22 },
  lg: { fontSize: 28, lineHeight: 28 },
} as const;

interface IWordmarkProps {
  size?: keyof typeof SIZE_MAP;
  variant?: 'dark' | 'light';
}

export const Wordmark: React.FC<IWordmarkProps> = ({ size = 'md', variant = 'dark' }) => {
  const { fontSize, lineHeight } = SIZE_MAP[size];
  const color = variant === 'light' ? COLORS.paper : COLORS.oxblood;

  return (
    <Text
      style={{
        fontFamily: 'Playfair Display',
        fontWeight: '400',
        fontSize,
        lineHeight,
        color,
        letterSpacing: fontSize * -0.02,
      }}
    >
      St<Text style={{ fontWeight: '800' }}>A</Text>ie.
    </Text>
  );
};

export default Wordmark;
