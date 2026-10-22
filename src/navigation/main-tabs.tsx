import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { Home, Package, Sparkles, WandSparkles, User, type LucideIcon } from 'lucide-react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { TryOnStack } from './try-on-stack';
import { ShopScreen } from '../features/products/screens/ShopScreen';
import { StylistScreen } from '../features/stylist/screens/StylistScreen';
import { ProfileStack } from './profile-stack';
import { AppHeader } from '../components/common/AppHeader';
import { FloatingChatBubble } from '../features/chat/components/FloatingChatBubble';

// React Navigation's screenOptions/tabBarIcon require plain style objects
// (no className support), so burgundy/cream tokens are inlined as hex here —
// see design-system.md Color System for the source values.
const COLORS = {
  surface: '#FBF9F7',
  surfaceContainer: '#EFEDEC',
  surfaceLine: '#E5DFD5',
  primaryContainer: '#5D1C34',
  primarySoft: '#FFD9E1',
  onPrimary: '#FFFFFF',
  onSurface: '#1B1C1B',
  onSurfaceVariant: '#534346',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) => (
  <View
    style={{
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? COLORS.primarySoft : 'transparent',
    }}
  >
    <Icon
      size={25}
      color={focused ? COLORS.primaryContainer : COLORS.onSurfaceVariant}
      strokeWidth={focused ? 2.2 : 1.8}
    />
  </View>
);

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', marginTop: 5 }}>
    <Text
      style={{
        fontSize: 12.5,
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
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: COLORS.primaryContainer,
          marginTop: 2,
        }}
      />
    ) : (
      <View style={{ width: 4, height: 4, marginTop: 2 }} />
    )}
  </View>
);

export const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader />,
        tabBarActiveTintColor: COLORS.primaryContainer,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceLine,
          height: 78 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tab.Navigator>
      <FloatingChatBubble />
    </View>
  );
};
