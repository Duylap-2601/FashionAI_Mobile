// Color values live in src/constants/theme.ts. GluestackUIProvider
// (src/components/ui/gluestack-ui-provider/config.ts) turns them into the CSS
// variables referenced here, so every color class supports opacity (bg-primary/90).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  important: 'html',
  theme: {
    extend: {
      // design-system.md › Spacing scale (mirrors SPACING in src/constants/theme.ts).
      // Named so className tokens like `px-xxl`, `mb-md`, `gap-md` resolve to real
      // values instead of silently matching nothing on Tailwind's numeric-only scale.
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
        giant: '48px',
      },
      colors: {
        // gluestack tokens — hard-coded by components from `npx gluestack-ui add`
        background: token('background'),
        foreground: token('foreground'),
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
        primary: {
          DEFAULT: token('primary'), // = primaryContainer, the brand CTA color
          foreground: token('primary-foreground'),
          container: token('primary-container'),
          strong: token('primary-strong'), // = COLORS.primary (#41051F), pressed/strong surfaces
          soft: token('primary-soft'),
          'soft-strong': token('primary-soft-strong'),
        },
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
        },
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        typography: {
          white: token('on-primary'),
          gray: token('outline-variant'),
          black: token('on-surface'),
        },

        // design-system tokens (design-system.md › Color System)
        surface: {
          DEFAULT: token('surface'),
          lowest: token('surface-lowest'),
          low: token('surface-low'),
          container: token('surface-container'),
          high: token('surface-high'),
          highest: token('surface-highest'),
          line: token('surface-line'),
        },
        outline: { DEFAULT: token('outline'), variant: token('outline-variant') },
        'on-primary': token('on-primary'),
        'on-surface': {
          DEFAULT: token('on-surface'),
          strong: token('on-surface-strong'),
          variant: token('on-surface-variant'),
        },
        'inverse-surface': token('inverse-surface'),
        'inverse-on-surface': token('inverse-on-surface'),
        tertiary: { DEFAULT: token('tertiary'), fixed: token('tertiary-fixed') },
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
      },
      // Be Vietnam Pro is embedded natively (app.json › expo-font); NativeWind uses only
      // the first family on native, the rest is the web fallback.
      // gluestack Text/Heading use font-body / font-heading.
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        body: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
        heading: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      // design-system.md › Typography roles, e.g. `text-headline-sm`, `text-price-lg`
      fontSize: {
        '2xs': '10px',
        display: ['34px', { lineHeight: '42px', fontWeight: '700' }],
        'headline-lg': ['26px', { lineHeight: '34px', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-sm': ['17px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg': ['13px', { lineHeight: '18px', fontWeight: '600' }],
        'label-md': ['11px', { lineHeight: '14px', fontWeight: '600' }],
        'price-lg': ['18px', { lineHeight: '22px', fontWeight: '700' }],
        'price-sm': ['13px', { lineHeight: '16px', fontWeight: '600' }],
      },
      // design-system.md › Radius scale
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        xxl: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.04)',
        md: '0 2px 6px rgba(0, 0, 0, 0.06)',
        lg: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      lineHeight: {
        // Relaxed body copy (empty-state/placeholder descriptions) — taller
        // than body-sm's own 16px line-height without hard-coding leading-[22px].
        relaxed: '22px',
      },
      // Fixed sizes for icon-as-emoji glyphs and avatar circles so screens
      // never need an arbitrary-value className (text-[48px], w-[72px], ...).
      width: {
        avatar: '72px',
      },
      height: {
        avatar: '72px',
      },
      maxWidth: {
        'empty-state': '260px',
        'error-state': '280px',
      },
      // gluestack component shadows
      boxShadow: {
        'hard-1': '-2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-2': '0px 3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-3': '2px 2px 8px 0px rgba(38, 38, 38, 0.20)',
        'hard-4': '0px -3px 10px 0px rgba(38, 38, 38, 0.20)',
        'hard-5': '0px 2px 10px 0px rgba(38, 38, 38, 0.10)',
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
        'soft-3': '0px 0px 30px rgba(38, 38, 38, 0.1)',
        'soft-4': '0px 0px 40px rgba(38, 38, 38, 0.1)',
      },
    },
  },
  plugins: [require('@gluestack-ui/nativewind-utils/tailwind-plugin')],
};
