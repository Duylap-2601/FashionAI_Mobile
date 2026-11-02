import React from 'react';
import { Animated, View, Text } from 'react-native';
import { homeScrollY } from './home-scroll';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import {
  getFocusedRouteNameFromRoute,
  useNavigation,
  useNavigationState,
  type NavigationProp,
  type NavigationState,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList, RootStackParamList } from './types';
import { Home, Package, Sparkles, Wand2, User, type LucideIcon } from 'lucide-react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { TryOnStack } from './try-on-stack';
import { ShopScreen } from '../features/products/screens/ShopScreen';
import { StylistScreen } from '../features/stylist/screens/StylistScreen';
import { ProfileStack } from './profile-stack';
import { AppHeader } from '../components/common/AppHeader';
import { AnnouncementBar } from '../features/home/components/AnnouncementBar';
import { COLORS as THEME_COLORS } from '../constants/theme';
import { FloatingChatBubble } from '../features/chat/components/FloatingChatBubble';

// React Navigation's screenOptions/tabBarIcon require plain style objects
// (no className support), so the Atelier Paper tokens are passed in as values.
// Mirrors FE's BottomTabBar (src/components/layout/BottomTabBar.tsx).
const COLORS = {
  paper: THEME_COLORS.paper,
  line: THEME_COLORS.line,
  primaryContainer: THEME_COLORS.primaryContainer,
  onPrimary: THEME_COLORS.onPrimary,
  muted: THEME_COLORS.muted,
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ANNOUNCEMENT_BAR_HEIGHT = 40;

const MainAnnouncementBar = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
        onPressTryOn={() => navigation.navigate('Main', { screen: 'TryOnTab' })}
        onPressShop={() => navigation.navigate('Main', { screen: 'ShopTab' })}
      />
    </Animated.View>
  );
};

const TabIcon = ({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) => (
  <Icon
    size={20}
    color={focused ? COLORS.primaryContainer : COLORS.muted}
    strokeWidth={1.75}
  />
);

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text
    style={{
      marginTop: 4,
      fontSize: 10,
      lineHeight: 10,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: focused ? COLORS.primaryContainer : COLORS.muted,
      fontFamily: 'Be Vietnam Pro',
    }}
  >
    {label}
  </Text>
);

// 2px × 32px oxblood indicator at the top of the active tab (FE BottomTabBar).
const TabButton = ({ children, style, accessibilityState, ...rest }: BottomTabBarButtonProps) => {
  const focused = accessibilityState?.selected ?? false;

  return (
    <PlatformPressable
      {...rest}
      accessibilityState={accessibilityState}
      style={style}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          marginLeft: -16,
          width: 32,
          height: 2,
          backgroundColor: focused ? COLORS.primaryContainer : 'transparent',
        }}
      />
      {children}
    </PlatformPressable>
  );
};

// MainTabs is rendered inside the RootStack, so read the nested tab route
// from the root navigation state to know which tab (screen) is on top.
const getFocusedTabName = (state: NavigationState): string | undefined => {
  const mainRoute = state.routes[state.index];
  if (mainRoute.name !== 'Main') return undefined;
  const tabState = mainRoute.state;
  if (!tabState) return 'HomeTab';
  return tabState.routes[tabState.index ?? 0]?.name;
};

export const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const focusedTabName = useNavigationState(getFocusedTabName);
  const isLandingPage = focusedTabName === 'HomeTab';

  return (
    <View style={{ flex: 1 }}>
    {/* Announcement bar lives only on the landing page (Home tab).
        The status bar strip uses the header paper color so the top edge
        stays seamless with the header. */}
    {isLandingPage ? (
      <View style={{ paddingTop: insets.top, backgroundColor: THEME_COLORS.paper }}>
        <MainAnnouncementBar />
      </View>
    ) : null}
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader />,
        tabBarButton: (props) => <TabButton {...props} />,
        tabBarActiveTintColor: COLORS.primaryContainer,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.paper,
          borderTopColor: COLORS.line,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          paddingHorizontal: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'FashionAI',
          header: () => <AppHeader safeAreaTop={false} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Trang chủ" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{
          title: 'Khám phá',
          header: () => <AppHeader showSearch={false} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Sản Phẩm" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Package} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TryOnTab"
        component={TryOnStack}
        options={({ route }) => ({
          title: 'Thử đồ',
          headerShown: (getFocusedRouteNameFromRoute(route) ?? 'TryOnHome') === 'TryOnHome',
          tabBarLabel: ({ focused }) => <TabLabel label="Thử đồ" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Sparkles} focused={focused} />,
        })}
      />
      <Tab.Screen
        name="StylistTab"
        component={StylistScreen}
        options={{
          title: 'AI Stylist',
          tabBarLabel: ({ focused }) => <TabLabel label="AI Stylist" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Wand2} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          headerShown: false,
          popToTopOnBlur: true,
          tabBarLabel: ({ focused }) => <TabLabel label="Tài khoản" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tab.Navigator>
      <FloatingChatBubble />
    </View>
  );
};
