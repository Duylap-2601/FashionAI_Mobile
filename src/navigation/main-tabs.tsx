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
import { Home, Package, Sparkles, WandSparkles, User, type LucideIcon } from 'lucide-react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { TryOnStack } from './try-on-stack';
import { ShopScreen } from '../features/products/screens/ShopScreen';
import { StylistScreen } from '../features/stylist/screens/StylistScreen';
import { ProfileStack } from './profile-stack';
import { AppHeader } from '../components/common/AppHeader';
import { AnnouncementBar } from '../features/home/components/AnnouncementBar';
import { COLORS as THEME_COLORS } from '../constants/theme';
import { FloatingChatBubble } from '../features/chat/components/FloatingChatBubble';
import { CartSync } from '../features/cart/components/CartSync';
import { useMyOrderChats, useOrderChatRealtime } from '../features/orders/hooks/use-order-chat';

// React Navigation's screenOptions (tabBarStyle, tint colors) and lucide icon props
// only take plain values, so the Atelier Paper tokens come from COLORS
// (design/design-system.md › Mobile Tab Shell). Label and indicator use className.
const COLORS = {
  paper: THEME_COLORS.paper,
  line: THEME_COLORS.line,
  oxblood: THEME_COLORS.oxblood,
  muted: THEME_COLORS.muted,
};

// design/DESIGN.md › Main Tab Shell: 78px plus the bottom safe area.
const TAB_BAR_HEIGHT = 78;

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

// Active: oxblood icon and label; inactive: muted (FE BottomTabBar uses the same tokens).
const TabIcon = ({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) => (
  <Icon
    size={20}
    color={focused ? COLORS.oxblood : COLORS.muted}
    strokeWidth={focused ? 2 : 1.75}
  />
);

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text
    numberOfLines={1}
    className={`mt-1 font-sans text-[10px] font-semibold uppercase leading-3 tracking-[0.1em] ${
      focused ? 'text-oxblood' : 'text-landing-muted'
    }`}
  >
    {label}
  </Text>
);

// 4x4 oxblood indicator dot under the active tab label (design/DESIGN.md › Main Tab Shell).
const TabButton = ({ children, style, accessibilityState, ...rest }: BottomTabBarButtonProps) => {
  const focused = accessibilityState?.selected ?? false;

  return (
    <PlatformPressable
      {...rest}
      accessibilityState={accessibilityState}
      style={style}
    >
      {children}
      <View
        pointerEvents="none"
        className={`absolute bottom-3 left-1/2 -ml-0.5 h-1 w-1 rounded-full ${
          focused ? 'bg-oxblood' : 'bg-transparent'
        }`}
      />
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
  const { totalUnread } = useMyOrderChats();

  useOrderChatRealtime();

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
        tabBarActiveTintColor: COLORS.oxblood,
        tabBarInactiveTintColor: COLORS.muted,
        // Paper bar with a 1px brass hairline on top, no elevation (design/design-system.md).
        tabBarStyle: {
          backgroundColor: COLORS.paper,
          borderTopColor: COLORS.line,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
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
          tabBarLabel: ({ focused }) => <TabLabel label="Sản phẩm" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Package} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TryOnTab"
        component={TryOnStack}
        options={({ route }) => ({
          title: 'Thử đồ',
          header: () => <AppHeader />,
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
          header: () => <AppHeader />,
          tabBarLabel: ({ focused }) => <TabLabel label="AI Stylist" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={WandSparkles} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          headerShown: false,
          popToTopOnBlur: true,
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: THEME_COLORS.oxblood,
            color: THEME_COLORS.paper,
            fontSize: 10,
          },
          tabBarLabel: ({ focused }) => <TabLabel label="Tài khoản" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tab.Navigator>
      <FloatingChatBubble />
      <CartSync />
    </View>
  );
};
