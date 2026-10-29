import { vars } from 'nativewind';
import { COLORS } from '@/constants/theme';

type ColorKey = keyof typeof COLORS;

// '#5D1C34' -> '93 28 52' (the "R G B" form tailwind.config.js wraps in rgb(var(--x)/<alpha-value>))
// 'rgba(166, 125, 68, 0.38)' -> '166 125 68 / 0.38' (used by colors that bake their own alpha)
function toRgbChannels(color: string): string {
  if (color.startsWith('#')) {
    const value = color.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).join(' ');
  }

  const match = color.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i
  );
  if (!match) {
    throw new Error(`Unsupported color value: ${color}`);
  }
  const [, r, g, b, a] = match;
  return a === undefined ? `${r} ${g} ${b}` : `${r} ${g} ${b} / ${a}`;
}

// CSS variable -> design-system color in src/constants/theme.ts.
// The first block uses gluestack's token names, which components added through
// `npx gluestack-ui add` hard-code (bg-primary, text-muted-foreground, border-border, ...).
// The second block exposes the rest of the design-system palette.
const tokenMap: Record<string, ColorKey> = {
  // gluestack tokens
  '--background': 'surface',
  '--foreground': 'onSurface',
  '--card': 'surfaceLowest',
  '--card-foreground': 'onSurface',
  '--popover': 'surfaceLowest',
  '--popover-foreground': 'onSurface',
  '--primary': 'primaryContainer',
  '--primary-foreground': 'onPrimary',
  '--secondary': 'surfaceHigh',
  '--secondary-foreground': 'onSurface',
  '--muted': 'surfaceLow',
  '--muted-foreground': 'secondary',
  '--accent': 'surfaceContainer',
  '--accent-foreground': 'onSurface',
  '--destructive': 'danger',
  '--destructive-foreground': 'onPrimary',
  '--border': 'surfaceLine',
  '--input': 'surfaceLine',
  '--ring': 'outline',

  // design-system tokens
  '--surface': 'surface',
  '--catalog-muted': 'catalogMuted',
  '--catalog-muted-text': 'catalogMutedText',
  '--catalog-line': 'catalogLine',
  '--catalog-tailoring': 'catalogTailoring',
  '--editorial-background': 'editorialBackground',
  '--surface-lowest': 'surfaceLowest',
  '--surface-low': 'surfaceLow',
  '--surface-container': 'surfaceContainer',
  '--surface-high': 'surfaceHigh',
  '--surface-highest': 'surfaceHighest',
  '--surface-line': 'surfaceLine',
  '--outline': 'outline',
  '--outline-variant': 'outlineVariant',
  '--primary-container': 'primaryContainer',
  '--primary-strong': 'primary',
  '--primary-soft': 'primarySoft',
  '--primary-soft-strong': 'primarySoftStrong',
  '--on-primary': 'onPrimary',
  '--on-surface': 'onSurface',
  '--on-surface-strong': 'onSurfaceStrong',
  '--on-surface-variant': 'onSurfaceVariant',
  '--inverse-surface': 'inverseSurface',
  '--inverse-on-surface': 'inverseOnSurface',
  '--tertiary': 'tertiary',
  '--tertiary-fixed': 'tertiaryFixed',
  '--success': 'success',
  '--warning': 'warning',
  '--danger': 'danger',
  // Atelier Paper – Saigon Editorial tokens
  '--paper': 'paper',
  '--ivory': 'ivory',
  '--obsidian': 'obsidian',
  '--oxblood': 'oxblood',
  '--brass': 'brass',
  '--brass-ink': 'brassInk',
  '--taupe': 'taupe',
  '--sage': 'sage',
  '--sage-ink': 'sageInk',
  '--landing-muted': 'muted',
  '--landing-line': 'line',
};

// The design system defines a light palette only (app.json pins userInterfaceStyle: light).
// Add a `dark` entry here once design/design-system.md defines dark tokens.
export const colors = {
  light: Object.fromEntries(
    Object.entries(tokenMap).map(([cssVar, key]) => [cssVar, toRgbChannels(COLORS[key])])
  ),
};

export type ModeType = keyof typeof colors;

export const config = {
  light: vars(colors.light),
};
