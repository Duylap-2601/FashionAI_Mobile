import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";
import { AuthStack } from "./auth-stack";
import { MainTabs } from "./main-tabs";
import { navigationTheme } from "./navigation-theme";

import { ProductDetailScreen } from "../features/products/screens/ProductDetailScreen";
import { CollectionDetailScreen } from "../features/collections/screens/CollectionDetailScreen";
import { ReviewsScreen } from "../features/reviews/screens/ReviewsScreen";
import { MyReviewsScreen } from "../features/reviews/screens/MyReviewsScreen";

import { OrderDetailScreen } from "../features/orders/screens/OrderDetailScreen";

import { StylistScreen } from "../features/stylist/screens/StylistScreen";
import { StylistHistoryScreen } from "../features/stylist/screens/StylistHistoryScreen";
import { StylistResultScreen } from "../features/stylist/screens/StylistResultScreen";

import { CartScreen } from "../features/cart/screens/CartScreen";
import { CheckoutScreen } from "../features/checkout/screens/CheckoutScreen";
import { PaymentScreen } from "../features/checkout/screens/PaymentScreen";
import { NotificationsScreen } from "../features/notifications/screens/NotificationsScreen";
import { ChatScreen } from "../features/chat/screens/ChatScreen";

import { useAuth } from "../features/auth/hooks/use-auth";
import { COLORS, FONT_SIZE } from "../constants/theme";

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
        screenOptions={{ headerShown: false }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />

            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ presentation: "modal" }}
            />

            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{
                headerShown: true,
                title: "Thanh toán SePay",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{
                headerShown: true,
                title: "Chi tiết đơn hàng",
                headerBackTitle: "Đơn hàng",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

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

            <Stack.Screen
              name="Reviews"
              component={ReviewsScreen}
              options={{
                headerShown: true,
                title: "Đánh giá sản phẩm",
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
              name="MyReviews"
              component={MyReviewsScreen}
              options={{
                headerShown: true,
                title: "Đánh giá của tôi",
                headerBackTitle: "Đánh giá",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="Stylist"
              component={StylistScreen}
              options={{
                headerShown: true,
                title: "AI Stylist",
                headerBackTitle: "Trang chủ",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="StylistHistory"
              component={StylistHistoryScreen}
              options={{
                headerShown: true,
                title: "Lịch sử AI Stylist",
                headerBackTitle: "AI Stylist",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="StylistResult"
              component={StylistResultScreen}
              options={{
                headerShown: true,
                title: "Kết quả tư vấn",
                headerBackTitle: "AI Stylist",
                headerTintColor: COLORS.primaryContainer,
                headerStyle: { backgroundColor: COLORS.surfaceLowest },
                headerTitleStyle: {
                  color: COLORS.onSurface,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
