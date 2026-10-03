import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TryOnStackParamList } from './types';
import { TryOnScreen } from '../features/try-on/screens/TryOnScreen';
import { TryOnHistoryScreen } from '../features/try-on/screens/TryOnHistoryScreen';
import { TryOnDetailScreen } from '../features/try-on/screens/TryOnDetailScreen';
import { TryOnLiveScreen } from '../features/try-on/screens/TryOnLiveScreen';
import { TryOnStylistScreen } from '../features/try-on/screens/TryOnStylistScreen';

const COLORS = {
  surface: '#FBF9F7',
  onSurface: '#1B1C1B',
};

const Stack = createNativeStackNavigator<TryOnStackParamList>();

export const TryOnStack: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="TryOnHome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TryOnHome" component={TryOnScreen} />
      <Stack.Screen
        name="TryOnHistory"
        component={TryOnHistoryScreen}
        options={{
          headerShown: true,
          title: 'Lịch sử Try-On',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTitleStyle: { fontWeight: '700' as const, color: COLORS.onSurface, fontSize: 18 },
        }}
      />
      <Stack.Screen name="TryOnDetail" component={TryOnDetailScreen} />
      <Stack.Screen name="TryOnLive" component={TryOnLiveScreen} />
      <Stack.Screen name="TryOnStylist" component={TryOnStylistScreen} />
    </Stack.Navigator>
  );
};
