import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";
import { AuthStack } from "./auth-stack";
import { MainTabs } from "./main-tabs";
import { navigationTheme } from "./navigation-theme";

import { ProductDetailScreen } from "../features/products/screens/ProductDetailScreen";
import { SearchScreen } from "../features/products/screens/SearchScreen";
import { CollectionDetailScreen } from "../features/collections/screens/CollectionDetailScreen";
import { ReviewsScreen } from "../features/reviews/screens/ReviewsScreen";
import { MyReviewsScreen } from "../features/reviews/screens/MyReviewsScreen";

import { OrderDetailScreen } from "../features/orders/screens/OrderDetailScreen";
import { OrderReturnsScreen } from "../features/orders/screens/OrderReturnsScreen";
import { OrderSuccessScreen } from "../features/orders/screens/OrderSuccessScreen";

import { StylistScreen } from "../features/stylist/screens/StylistScreen";
import { StylistHistoryScreen } from "../features/stylist/screens/StylistHistoryScreen";
import { StylistResultScreen } from "../features/stylist/screens/StylistResultScreen";

import { CartScreen } from "../features/cart/screens/CartScreen";
import { CheckoutScreen } from "../features/checkout/screens/CheckoutScreen";
import { PaymentScreen } from "../features/checkout/screens/PaymentScreen";
import { NotificationsScreen } from "../features/notifications/screens/NotificationsScreen";
import { PushNotificationsHandler } from "../features/notifications/hooks/use-push-notifications";
import { ChatScreen } from "../features/chat/screens/ChatScreen";
import { SubscriptionPlansScreen } from "../features/subscription/screens/SubscriptionPlansScreen";
import { SubscriptionHistoryScreen } from "../features/subscription/screens/SubscriptionHistoryScreen";
import { PolicyScreen } from "../features/profile/screens/PolicyScreen";

import { useAuth } from "../features/auth/hooks/use-auth";
import { COLORS, FONT_SIZE } from "../constants/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-landing-paper p-xl">
        <ActivityIndicator size="large" color={COLORS.oxblood} />
        <Text className="mt-md font-sans text-body-sm text-landing-muted">
          Đang khởi động FashionAI...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {/* Native headers take plain style objects; values come from COLORS
          (design/design-system.md › Navigation And Headers: paper header, obsidian title). */}
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
                headerShown: false,
                presentation: "modal",
              }}
            />

            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="OrderReturns"
              component={OrderReturnsScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="OrderSuccess"
              component={OrderSuccessScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: true,
                title: "Chi tiết sản phẩm",
                headerBackTitle: "Sản phẩm",
                headerTintColor: COLORS.oxblood,
                // Header shares the Product Detail paper surface.
                headerStyle: { backgroundColor: COLORS.paper },
                headerShadowVisible: false,
                headerTitleStyle: {
                  color: COLORS.obsidian,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="CollectionDetail"
              component={CollectionDetailScreen}
              options={{
                headerShown: true,
                title: "Bộ sưu tập",
                headerBackTitle: "Trang chủ",
                headerTintColor: COLORS.oxblood,
                headerStyle: { backgroundColor: COLORS.paper },
                headerTitleStyle: {
                  color: COLORS.obsidian,
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
                headerTintColor: COLORS.oxblood,
                headerStyle: { backgroundColor: COLORS.paper },
                headerTitleStyle: {
                  color: COLORS.obsidian,
                  fontSize: FONT_SIZE.md,
                },
              }}
            />

            <Stack.Screen
              name="MyReviews"
              component={MyReviewsScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="Stylist"
              component={StylistScreen}
              options={{
                headerShown: true,
                title: "AI Stylist",
                headerBackTitle: "Trang chủ",
                headerTintColor: COLORS.oxblood,
                headerStyle: { backgroundColor: COLORS.paper },
                headerShadowVisible: false,
                headerTitleStyle: {
                  color: COLORS.obsidian,
                  fontFamily: "Playfair Display",
                  fontSize: FONT_SIZE.xl,
                },
              }}
            />

            <Stack.Screen
              name="StylistHistory"
              component={StylistHistoryScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="StylistResult"
              component={StylistResultScreen}
              options={{
                headerShown: true,
                title: "Kết quả tư vấn",
                headerBackTitle: "AI Stylist",
                headerTintColor: COLORS.oxblood,
                headerStyle: { backgroundColor: COLORS.paper },
                headerShadowVisible: false,
                headerTitleStyle: {
                  color: COLORS.obsidian,
                  fontFamily: "Playfair Display",
                  fontSize: FONT_SIZE.xl,
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
              name="SubscriptionPlans"
              component={SubscriptionPlansScreen}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="SubscriptionHistory"
              component={SubscriptionHistoryScreen}
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

            <Stack.Screen
              name="Policy"
              component={PolicyScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
      {isAuthenticated ? <PushNotificationsHandler /> : null}
    </NavigationContainer>
  );
};
