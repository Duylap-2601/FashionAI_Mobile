import { NavigatorScreenParams } from '@react-navigation/native';
import { TryOnCategory } from '@/features/try-on/types/try-on';

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
  Measurements: { tab?: 'profile' | 'measurements' | 'sizes' } | undefined;
  Addresses: undefined;
  Orders: undefined;
  TryOnHistory: undefined;
  TryOnDetail: { id: string };
};

export type TryOnEntryParams = {
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  category?: TryOnCategory;
};

export type TryOnStackParamList = {
  TryOnHome: TryOnEntryParams | undefined;
  TryOnHistory: undefined;
  TryOnDetail: { id: string };
  TryOnLive: TryOnEntryParams | undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TryOnTab: NavigatorScreenParams<TryOnStackParamList> | undefined;
  ShopTab: undefined;
  StylistTab: undefined;
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
  OrderSuccess: {
    orderId: string | number;
    orderCode?: string;
    totalAmount?: number;
  };

  Cart: undefined;
  SubscriptionPlans: undefined;
  SubscriptionHistory: undefined;
  Search: { query?: string } | undefined;
  Chat: { sessionId?: string; productId?: string } | undefined;
  Checkout: undefined;
  Payment: {
    checkoutUrl: string;
    provider: string;
    paymentId?: string;
    orderId?: string | number;
    qrCode?: string;
    orderCode?: string;
    totalAmount?: number;
    targetTier?: string;
    returnRoute?: string;
  };
  Notifications: undefined;
  Policy: { type?: 'privacy' | 'terms' | 'return' } | undefined;
};
