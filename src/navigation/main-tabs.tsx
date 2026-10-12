import React from 'react';
import { View, Pressable, Text, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from './types';
import { Heart, ShoppingBag } from 'lucide-react-native';
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
  onPrimary: '#FFFFFF',
  onSurface: '#1B1C1B',
  onSurfaceVariant: '#534346',
};

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
          fontWeight: '600' as const,
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
        component={TryOnStack}
        options={{
          title: 'Thử Đồ',
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
          popToTopOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
