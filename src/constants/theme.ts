export const COLORS = {
  surface: "#FBF9F7",
  background: "#FBF9F7",
  surfaceLowest: "#FFFFFF",
  surfaceLow: "#F5F3F1",
  surfaceContainer: "#EFEDEC",
  surfaceHigh: "#EAE8E6",
  surfaceHighest: "#E4E2E0",
  surfaceLine: "#E5DFD5",

  // Legacy aliases still used by existing Dev 2 / shared UI
  commerceSurface: "#FBF9F7",
  surfaceMuted: "#F1F5F9",

  // Deployed catalog palette; additive so other developers' screens keep their theme.
  catalogMuted: "#F9F7F5",
  catalogMutedText: "#8B8880",
  catalogLine: "#F0EEE9",
  catalogTailoring: "#FDFBF7",
  // Deployed Home editorial surround and image scrim; existing aliases stay intact.
  editorialBackground: "#0E161C",
  editorialShade: "#000000",

  // FashionAI commerce palette. Existing aliases above remain unchanged so
  // feature work can migrate without restyling unrelated screens.
  primary: "#41051F",
  primaryContainer: "#5D1C34",
  primarySoft: "#FFD9E1",
  primarySoftStrong: "#FFB1C6",
  onPrimary: "#FFFFFF",

  // Secondary / tertiary — use new main design-system values
  secondary: "#645D5C",
  tertiary: "#705D00",
  tertiaryFixed: "#FFE173",

  // Surface content
  onSurface: "#1B1C1B",
  onSurfaceStrong: "#1A1917",
  onSurfaceVariant: "#534346",

  inverseSurface: "#30302F",
  inverseOnSurface: "#F2F0EE",

  // Borders / outlines
  outline: "#857276",
  outlineVariant: "#D7C1C5",

  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  textInverse: "#ffffff",

  // Legacy border aliases
  border: "#E2E8F0",
  borderDark: "#CBD5E1",

  // Status
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#BA1A1A",
} as const;

export const SPACING = {
  catalogGap: 10,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  giant: 48,
} as const;

// Be Vietnam Pro 400-900, embedded at build time by the expo-font plugin in app.json.
// One family name on iOS and Android, so fontWeight picks the right file.
export const FONT_FAMILY = "Be Vietnam Pro";

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
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
  black: "900",
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
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

export default THEME;
