import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TryOnStackParamList } from './types';
import { TryOnScreen } from '../features/try-on/screens/TryOnScreen';
import { TryOnHistoryScreen } from '../features/try-on/screens/TryOnHistoryScreen';
import { TryOnDetailScreen } from '../features/try-on/screens/TryOnDetailScreen';
import { TryOnLiveScreen } from '../features/try-on/screens/TryOnLiveScreen';

const Stack = createNativeStackNavigator<TryOnStackParamList>();

export const TryOnStack: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="TryOnHome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TryOnHome" component={TryOnScreen} />
      <Stack.Screen name="TryOnHistory" component={TryOnHistoryScreen} />
      <Stack.Screen name="TryOnDetail" component={TryOnDetailScreen} />
      <Stack.Screen name="TryOnLive" component={TryOnLiveScreen} />
    </Stack.Navigator>
  );
};
