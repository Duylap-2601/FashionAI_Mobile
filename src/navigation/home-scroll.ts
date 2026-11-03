import { Animated } from 'react-native';

// Shared between HomeScreen's ScrollView and the AnnouncementBar in MainTabs,
// so the bar can hide on scroll-down and reveal on scroll-up without lifting
// scroll state into the navigator.
export const homeScrollY = new Animated.Value(0);
