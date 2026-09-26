import React from 'react';
import { View } from 'react-native';
import { COLORS } from '@/constants/theme';

/**
 * Keeps a registered route renderable while its feature screen is implemented.
 * Route-specific UI belongs to the owning feature and replaces this placeholder.
 */
export const RoutePlaceholderScreen: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.background }} />
);
