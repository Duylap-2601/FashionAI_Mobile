import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { ChangePasswordScreen } from '../features/auth/screens/ChangePasswordScreen';
import { MeasurementsScreen } from '../features/measurements/screens/MeasurementsScreen';

// React Navigation's screenOptions/options require plain style objects (no
// className support), so burgundy/cream tokens are inlined as hex here — see
// design-system.md Color System for the source values.
const COLORS = {
  surface: '#FBF9F7',
  onSurface: '#1B1C1B',
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="ProfileHome">
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{
          title: 'Hồ sơ cá nhân',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.surface },
          headerTitleStyle: {
            fontWeight: '700' as const,
            color: COLORS.onSurface,
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Đổi mật khẩu',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.surface },
          headerTitleStyle: {
            fontWeight: '700' as const,
            color: COLORS.onSurface,
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen
        name="Measurements"
        component={MeasurementsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
