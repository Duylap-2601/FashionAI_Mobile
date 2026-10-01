export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  tier?: 'FREE' | 'MEMBER' | 'VIP';
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt?: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
}

export interface AuthResponseData extends AuthTokens {
  user: User;
}

export interface RegisterResponseData {
  email: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ExchangeCodeDto {
  code: string;
}
