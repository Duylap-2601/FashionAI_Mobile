import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { TryOnScreen } from '../features/try-on/screens/TryOnScreen';
import { ShopScreen } from '../features/products/screens/ShopScreen';
import { RackScreen } from '../features/rack/screens/RackScreen';
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
  const insets = useSafeAreaInsets();

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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: FONT_WEIGHT.semibold as any,
          marginTop: 2,
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
