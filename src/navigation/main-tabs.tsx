import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { HomeScreen } from '../features/home/screens/home-screen';
import { TryOnScreen } from '../features/try-on/screens/try-on-screen';
import { ShopScreen } from '../features/products/screens/shop-screen';
import { RackScreen } from '../features/rack/screens/rack-screen';
import { ProfileStack } from './profile-stack';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const TabIcon = ({
  name,
  focused,
}: {
  name: IoniconName;
  focused: boolean;
}) => (
  <Ionicons
    name={name}
    size={23}
    color={focused ? COLORS.primaryContainer : COLORS.onSurfaceVariant}
  />
);

const TryOnTabIcon = ({ focused }: { focused: boolean }) => (
  <View
    style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      backgroundColor: focused ? COLORS.primaryContainer : COLORS.surfaceContainer,
    }}
  >
    <Ionicons
      name="color-wand"
      size={20}
      color={focused ? COLORS.onPrimary : COLORS.onSurfaceVariant}
    />
  </View>
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
          color: COLORS.onSurface,
          fontSize: FONT_SIZE.lg,
        },
        tabBarActiveTintColor: COLORS.primaryContainer,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceLine,
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
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{
          title: 'Khám phá',
          tabBarLabel: 'Khám phá',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="TryOnTab"
        component={TryOnScreen}
        options={{
          title: 'Virtual Try-On',
          tabBarLabel: 'Thử đồ',
          tabBarIcon: ({ focused }) => <TryOnTabIcon focused={focused} />,
        }}
      />
      <Tab.Screen
        name="RackTab"
        component={RackScreen}
        options={{
          title: 'Tủ đồ',
          tabBarLabel: 'Tủ đồ',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'shirt' : 'shirt-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Tài khoản',
          tabBarLabel: 'Tài khoản',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
