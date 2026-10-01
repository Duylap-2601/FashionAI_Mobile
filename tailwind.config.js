/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Surfaces
        surface: '#FBF9F7',
        background: '#FBF9F7',
        'surface-lowest': '#FFFFFF',
        'surface-low': '#F5F3F1',
        'surface-container': '#EFEDEC',
        'surface-high': '#EAE8E6',
        'surface-highest': '#E4E2E0',
        'surface-line': '#E5DFD5',

        // Outlines
        'outline-variant': '#D7C1C5',
        outline: '#857276',

        // Brand / primary
        primary: '#41051F',
        'primary-container': '#5D1C34',
        'primary-soft': '#FFD9E1',
        'primary-soft-strong': '#FFB1C6',
        'on-primary': '#FFFFFF',

        // Text
        'on-surface': '#1B1C1B',
        'on-surface-strong': '#1A1917',
        'on-surface-variant': '#534346',
        secondary: '#645D5C',

        // Inverse (toasts, dark overlays)
        'inverse-surface': '#30302F',
        'inverse-on-surface': '#F2F0EE',

        // Accent
        tertiary: '#705D00',
        'tertiary-fixed': '#FFE173',

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#BA1A1A',
        'danger-soft': '#FEE2E2',
        'danger-soft-strong': '#FCA5A5',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'System'],
      },
      fontSize: {
        // [fontSize, { lineHeight, fontWeight }] — design-system.md Typography scale
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
        // Legacy aliases kept for screens migrated off theme.ts — map onto the
        // closest design-system.md scale step.
        xl: ['20px', { lineHeight: '28px', fontWeight: '700' }],
        xxl: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        xxxl: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        // Emoji-as-icon glyph sizes (no native icon font wired up yet — see
        // design-system.md "Iconography" note). Not part of the type scale.
        'icon-lg': ['28px', { lineHeight: '28px' }],
        'icon-xl': ['40px', { lineHeight: '40px' }],
        'icon-giant': ['48px', { lineHeight: '48px' }],
      },
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
    },
  },
  plugins: [require('@gluestack-ui/nativewind-utils/tailwind-plugin')],
};
