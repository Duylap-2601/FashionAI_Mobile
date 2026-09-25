import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { TryOnScreen } from '../screens/tryon/TryOnScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';
import { StylistScreen } from '../screens/stylist/StylistScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.65 }}>
    {icon}
  </Text>
);

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTitleStyle: {
          fontWeight: FONT_WEIGHT.bold as any,
          color: COLORS.textPrimary,
          fontSize: FONT_SIZE.lg,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: FONT_WEIGHT.semibold as any,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'FashionAI',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TryOnTab"
        component={TryOnScreen}
        options={{
          title: 'Virtual Try-On',
          tabBarLabel: 'Thử đồ',
          tabBarIcon: ({ focused }) => <TabIcon icon="👗" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{
          title: 'Cửa hàng',
          tabBarLabel: 'Mua sắm',
          tabBarIcon: ({ focused }) => <TabIcon icon="🛍️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="StylistTab"
        component={StylistScreen}
        options={{
          title: 'AI Stylist',
          tabBarLabel: 'Stylist',
          tabBarIcon: ({ focused }) => <TabIcon icon="✨" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Hồ sơ cá nhân',
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};
