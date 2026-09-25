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
        surface: '#FBF9F7',
        'surface-lowest': '#FFFFFF',
        'surface-low': '#F5F3F1',
        'surface-container': '#EFEDEC',
        'surface-high': '#EAE8E6',
        'surface-line': '#E5DFD5',
        primary: '#41051F',
        'primary-container': '#5D1C34',
        'primary-soft': '#FFD9E1',
        'on-primary': '#FFFFFF',
        'on-surface': '#1B1C1B',
        'on-surface-variant': '#534346',
        secondary: '#645D5C',
        tertiary: '#705D00',
        'tertiary-fixed': '#FFE173',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#BA1A1A',
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'System'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
