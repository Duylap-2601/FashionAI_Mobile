import { Platform } from 'react-native';
import { DefaultTheme, type Theme } from '@react-navigation/native';
import { COLORS, FONT_FAMILY } from '../constants/theme';

// Headers and tab labels take their font from the navigation theme.
// Web keeps React Navigation's system stack: the font is only embedded in native builds.
const fonts: Theme['fonts'] =
  Platform.OS === 'web'
    ? DefaultTheme.fonts
    : {
        regular: { fontFamily: FONT_FAMILY, fontWeight: '400' },
        medium: { fontFamily: FONT_FAMILY, fontWeight: '500' },
        bold: { fontFamily: FONT_FAMILY, fontWeight: '600' },
        heavy: { fontFamily: FONT_FAMILY, fontWeight: '700' },
      };

// Screen canvas, default headers and the tab bar sit on paper with obsidian ink and an
// oxblood accent; borders use the brass hairline (design/design-system.md › Color System).
const colors: Theme['colors'] = {
  ...DefaultTheme.colors,
  primary: COLORS.oxblood,
  background: COLORS.paper,
  card: COLORS.paper,
  text: COLORS.obsidian,
  border: COLORS.line,
  notification: COLORS.oxblood,
};

export const navigationTheme: Theme = { ...DefaultTheme, colors, fonts };
