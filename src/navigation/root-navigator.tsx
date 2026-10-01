import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { AuthStack } from "./auth-stack";
import { MainTabs } from "./main-tabs";
import { RoutePlaceholderScreen } from "../components/common/RoutePlaceholderScreen";
import { ProductDetailScreen } from "../features/products/screens/ProductDetailScreen";
import { CollectionDetailScreen } from "../features/collections/screens/CollectionDetailScreen";
import { useAuth } from "../features/auth/hooks/use-auth";
import { COLORS, SPACING, FONT_SIZE } from "../constants/theme";
import { navigationTheme } from "./navigation-theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface p-xl">
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text className="mt-md text-body-sm text-on-surface-variant">
          Đang khởi động FashionAI...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "fade" }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: true,
                title: "Chi tiết sản phẩm",
                headerBackTitle: "Sản phẩm",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />
            <Stack.Screen
              name="CollectionDetail"
              component={CollectionDetailScreen}
              options={{
                headerShown: true,
                title: "Bộ sưu tập",
                headerBackTitle: "Trang chủ",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />
            <Stack.Screen name="Reviews" component={RoutePlaceholderScreen} />
            <Stack.Screen name="Rack" component={RoutePlaceholderScreen} />
            <Stack.Screen
              name="StylistHistory"
              component={RoutePlaceholderScreen}
            />
            <Stack.Screen
              name="StylistResult"
              component={RoutePlaceholderScreen}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
