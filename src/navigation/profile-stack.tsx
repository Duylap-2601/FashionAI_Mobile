import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { AddressesScreen } from '../features/profile/screens/AddressesScreen';
import { ChangePasswordScreen } from '../features/auth/screens/ChangePasswordScreen';
import { MeasurementsScreen } from '../features/measurements/screens/MeasurementsScreen';
import { OrdersScreen } from '../features/orders/screens/OrdersScreen';
import { TryOnHistoryScreen } from '../features/try-on/screens/TryOnHistoryScreen';
import { TryOnDetailScreen } from '../features/try-on/screens/TryOnDetailScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="ProfileHome">
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Measurements"
        component={MeasurementsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TryOnHistory"
        component={TryOnHistoryScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TryOnDetail"
        component={TryOnDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
