const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem: 16 keeps the Tailwind spacing scale on the design-system grid
// (p-1 = 4, p-4 = 16, p-6 = 24); NativeWind's native default is 14.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
