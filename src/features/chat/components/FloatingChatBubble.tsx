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

// Nút vuông 2px đỏ đô cố định góc phải, nổi trên tab bar (cùng nút mở trợ lý của web).
// Không đổ bóng theo design/DESIGN.md: khối đỏ đô đủ tách khỏi nền giấy.
// Mount 1 lần trong MainTabs nên hiện trên mọi tab; màn Chat (RootStack) đè lên trên.
export const FloatingChatBubble: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focusedRouteName = useNavigationState((state) =>
    getLeafRouteName(state.routes[state.index]),
  );
  const activeTabRoute = useNavigationState((state) => {
    const rootRoute = state.routes[state.index];
    return rootRoute?.state
      ? rootRoute.state.routes[rootRoute.state.index ?? 0]
      : undefined;
  });
  const isProfileTab = activeTabRoute?.name === 'ProfileTab';
  const isTryOnRoute =
    focusedRouteName === 'TryOnHome' || focusedRouteName === 'TryOnLive';

  // Các màn tài khoản và phòng thử đồ không cần bubble chat.
  if (isProfileTab || focusedRouteName === 'Orders' || isTryOnRoute) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mở trợ lý thời trang"
      onPress={() => navigation.navigate('Chat', {})}
      className="absolute bottom-32 right-4 h-14 w-14 items-center justify-center rounded-subtle bg-oxblood active:opacity-90"
    >
      <MessageCircle size={20} strokeWidth={1.75} color={COLORS.paper} />
    </Pressable>
  );
};

export default FloatingChatBubble;
