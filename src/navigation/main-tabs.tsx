import React from 'react';
import { Animated, View, Text } from 'react-native';
import { homeScrollY } from './home-scroll';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from './types';
import { Home, Package, Sparkles, MessageCircle, User, type LucideIcon } from 'lucide-react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { TryOnStack } from './try-on-stack';
import { ShopScreen } from '../features/products/screens/ShopScreen';
import { StylistScreen } from '../features/stylist/screens/StylistScreen';
import { ProfileStack } from './profile-stack';
import { AppHeader } from '../components/common/AppHeader';
import { AnnouncementBar } from '../features/home/components/AnnouncementBar';
import { FloatingChatBubble } from '../features/chat/components/FloatingChatBubble';
import { useNavigation, type NavigationProp } from '@react-navigation/native';

// React Navigation's screenOptions/tabBarIcon require plain style objects
// (no className support), so burgundy/cream tokens are inlined as hex here —
// see design/design-system.md Color System for the source values.
const COLORS = {
  surface: '#FBF9F7',
  surfaceContainer: '#EFEDEC',
  surfaceLine: '#E5DFD5',
  primaryContainer: '#5D1C34',
  primarySoft: 'rgba(93, 28, 52, 0.1)',
  onPrimary: '#FFFFFF',
  onSurface: '#1B1C1B',
  onSurfaceVariant: '#534346',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ANNOUNCEMENT_BAR_HEIGHT = 40;

const MainAnnouncementBar = () => {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  const height = homeScrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [ANNOUNCEMENT_BAR_HEIGHT, 0],
    extrapolate: 'clamp',
  });
  const opacity = homeScrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{ height, opacity, overflow: 'hidden' }}>
      <AnnouncementBar
        onPressTryOn={() => navigation.navigate('TryOnTab')}
        onPressShop={() => navigation.navigate('ShopTab')}
      />
    </Animated.View>
  );
};

const TabIcon = ({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) => (
  <View
    style={{
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? COLORS.primarySoft : 'transparent',
    }}
  >
    <Icon
      size={20}
      color={focused ? COLORS.primaryContainer : COLORS.onSurfaceVariant}
      strokeWidth={focused ? 2.2 : 1.8}
    />
  </View>
);

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', marginTop: 3 }}>
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? ('700' as const) : ('600' as const),
        color: focused ? COLORS.primaryContainer : COLORS.onSurfaceVariant,
        fontFamily: 'Be Vietnam Pro',
      }}
    >
      {label}
    </Text>
    {focused ? (
      <View
        style={{
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: COLORS.primaryContainer,
          marginTop: 2,
        }}
      />
    ) : (
      <View style={{ width: 3, height: 3, marginTop: 2 }} />
    )}
  </View>
);

export const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
    <View style={{ paddingTop: insets.top, backgroundColor: '#11100F' }}>
      <MainAnnouncementBar />
    </View>
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader safeAreaTop={false} />,
        tabBarActiveTintColor: COLORS.primaryContainer,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceLine,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 2,
          paddingTop: 4,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'FashionAI',
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{
          title: 'Khám phá',
          tabBarLabel: ({ focused }) => <TabLabel label="Sản Phẩm" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Package} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TryOnTab"
        component={TryOnStack}
        options={({ route }) => ({
          title: 'Try-On',
          headerShown: (getFocusedRouteNameFromRoute(route) ?? 'TryOnHome') === 'TryOnHome',
          tabBarLabel: ({ focused }) => <TabLabel label="Try-On" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Sparkles} focused={focused} />,
        })}
      />
      <Tab.Screen
        name="StylistTab"
        component={StylistScreen}
        options={{
          title: 'AI Stylist',
          tabBarLabel: ({ focused }) => <TabLabel label="AI Assist" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={MessageCircle} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          headerShown: false,
          popToTopOnBlur: true,
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tab.Navigator>
      <FloatingChatBubble />
    </View>
  );
};
