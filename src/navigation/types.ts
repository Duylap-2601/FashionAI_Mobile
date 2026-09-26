import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TryOnTab: undefined;
  ShopTab: undefined;
  StylistTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductDetail: { productId: string };
  CollectionDetail: { collectionId: string; collectionSlug: string };
  Reviews: { productId: string };
  Rack: undefined;
  StylistHistory: undefined;
  StylistResult: { resultId: string };
};
