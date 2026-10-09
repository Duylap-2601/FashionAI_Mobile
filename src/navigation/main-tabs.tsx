import React from 'react';
import { View, Pressable, Text, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from './types';
import { Heart, ShoppingBag, Home, Package, Sparkles, Shirt, User, type LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/hooks/use-auth';
import { useCartStore } from '../features/cart/store/use-cart-store';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { TryOnStack } from './try-on-stack';
import { ShopScreen } from '../features/products/screens/ShopScreen';
import { RackScreen } from '../features/rack/screens/RackScreen';
import { ProfileStack } from './profile-stack';
import { NotificationBell } from '../features/notifications/components/NotificationBell';

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

const HeaderRight = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const totalItems = useCartStore(state => state.getTotalItems());

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 16 }}>
      <Pressable onPress={() => {}}>
        <Heart size={24} color={COLORS.onSurface} />
      </Pressable>
      
      <Pressable onPress={() => navigation.navigate('Cart')} style={{ position: 'relative' }}>
        <ShoppingBag size={24} color={COLORS.onSurface} />
        {totalItems > 0 && (
          <View style={{
            position: 'absolute', top: -6, right: -6, 
            backgroundColor: '#C81E51', 
            borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1.5, borderColor: COLORS.surface
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
              {totalItems > 99 ? '99+' : totalItems}
            </Text>
          </View>
        )}
      </Pressable>
      
      <NotificationBell />
      
      <Pressable onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' } as any)}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={{ width: 30, height: 30, borderRadius: 15 }} />
        ) : (
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.surfaceContainer, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.onSurfaceVariant }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

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
          fontWeight: '700' as const,
          color: COLORS.onSurface,
          fontSize: 18,
        },
        headerRight: () => <HeaderRight />,
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
        options={{
          title: 'Virtual Try-On',
          tabBarLabel: ({ focused }) => <TabLabel label="Try-On" focused={focused} />,
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Sparkles} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="RackTab"
        component={RackScreen}
        options={{
          title: 'Tủ đồ',
          tabBarLabel: ({ focused }) => <TabLabel label="Tủ đồ" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Shirt} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Tài khoản',
          headerShown: false,
          popToTopOnBlur: true,
          tabBarLabel: ({ focused }) => <TabLabel label="Tài khoản" focused={focused} />,
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};
