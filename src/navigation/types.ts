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
  Measurements: undefined;
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
  TryOnStylist: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TryOnTab: NavigatorScreenParams<TryOnStackParamList> | undefined;
  ShopTab: undefined;
  RackTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Cart: undefined;
  SubscriptionPlans: undefined;
};
