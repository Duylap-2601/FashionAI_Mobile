import { NavigatorScreenParams } from '@react-navigation/native';

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
  Cart: undefined;
  Checkout: undefined;
};
