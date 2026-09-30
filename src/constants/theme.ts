export const COLORS = {
  surface: '#FBF9F7',
  background: '#FBF9F7',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#F5F3F1',
  surfaceContainer: '#EFEDEC',
  surfaceHigh: '#EAE8E6',
  surfaceHighest: '#E4E2E0',
  surfaceLine: '#E5DFD5',

  outlineVariant: '#D7C1C5',
  outline: '#857276',

  primary: '#41051F',
  primaryContainer: '#5D1C34',
  primarySoft: '#FFD9E1',
  primarySoftStrong: '#FFB1C6',
  onPrimary: '#FFFFFF',

  onSurface: '#1B1C1B',
  onSurfaceStrong: '#1A1917',
  onSurfaceVariant: '#534346',
  secondary: '#645D5C',

  inverseSurface: '#30302F',
  inverseOnSurface: '#F2F0EE',

  tertiary: '#705D00',
  tertiaryFixed: '#FFE173',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#BA1A1A',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  giant: 48,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

export default THEME;
