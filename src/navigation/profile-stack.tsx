import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '../features/profile/screens/profile-screen';
import { ChangePasswordScreen } from '../features/auth/screens/change-password-screen';
import { COLORS, FONT_WEIGHT, FONT_SIZE } from '../constants/theme';

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
            fontWeight: FONT_WEIGHT.bold as any,
            color: COLORS.onSurface,
            fontSize: FONT_SIZE.lg,
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
            fontWeight: FONT_WEIGHT.bold as any,
            color: COLORS.onSurface,
            fontSize: FONT_SIZE.lg,
          },
        }}
      />
    </Stack.Navigator>
  );
};
