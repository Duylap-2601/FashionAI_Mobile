import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  VerifyEmail: { email: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ChangePassword: undefined;
  Measurements: undefined;
  Orders: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TryOnTab: undefined;
  ShopTab: undefined;
  RackTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;

  ProductDetail: { productId: string };
  CollectionDetail: { slug: string };
  Reviews: { productId: string };
  MyReviews: undefined;

  Stylist: undefined;
  StylistHistory: undefined;
  StylistResult: { resultId: string };

  OrderDetail: { orderId: string | number };

  Cart: undefined;
  Checkout: undefined;
  Payment: { checkoutUrl: string; provider: string; paymentId?: string; orderId?: string | number; qrCode?: string; orderCode?: string; totalAmount?: number; };
};
