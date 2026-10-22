import React from 'react';
import { Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';

type NestedRoute = {
  name?: string;
  state?: {
    index?: number;
    routes: readonly NestedRoute[];
  };
};

function getLeafRouteName(route: NestedRoute | undefined): string | undefined {
  if (!route?.state) return route?.name;
  return getLeafRouteName(route.state.routes[route.state.index ?? 0]);
}

// Bubble tròn burgundy cố định góc phải, nổi trên tab bar (theo ảnh thiết kế).
// Mount 1 lần trong MainTabs nên hiện trên mọi tab; màn Chat (RootStack) đè lên trên.
export const FloatingChatBubble: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focusedRouteName = useNavigationState((state) =>
    getLeafRouteName(state.routes[state.index]),
  );

  if (focusedRouteName === 'Orders') {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel="Trò chuyện với StAle"
      onPress={() => navigation.navigate('Chat', {})}
      className="absolute bottom-32 right-4 min-h-11 min-w-11 items-center justify-center rounded-full bg-primary-container p-md shadow-sm"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <MessageCircle size={26} color={COLORS.onPrimary} />
    </Pressable>
  );
};

export default FloatingChatBubble;
