import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { User, LoginDto, RegisterDto } from '../types/auth';
import { authApi } from '../api/auth.api';
import { getTokens, setTokens, clearTokens, getStoredUser, setStoredUser } from './secureStorage';
import { onUnauthorized } from '../api/client';
import { ENV } from '../config/env';

// Complete auth session if returning from WebBrowser
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check existing session
  useEffect(() => {
    let isMounted = true;

    async function bootstrapAsync() {
      try {
        const { accessToken } = await getTokens();
        if (!accessToken) {
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // Try getting cached user first for faster render
        const cachedUser = await getStoredUser();
        if (cachedUser && isMounted) {
          setUser(cachedUser);
        }

        // Validate token with backend /users/me
        try {
          const freshUser = await authApi.getCurrentUser();
          if (isMounted) {
            setUser(freshUser);
            await setStoredUser(freshUser);
          }
        } catch (error) {
          console.warn('Token validation failed during bootstrap:', error);
        }
      } catch (err) {
        console.error('Error restoring auth state:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapAsync();

    // Subscribe to unrecoverable unauthorized events from API client
    const unsubscribe = onUnauthorized(() => {
      setUser(null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (data: LoginDto) => {
    const res = await authApi.login(data);
    await setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    await setStoredUser(res.user);
    setUser(res.user);
  };

  const register = async (data: RegisterDto) => {
    const res = await authApi.register(data);
    await setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    await setStoredUser(res.user);
    setUser(res.user);
  };

  const loginWithGoogle = async () => {
    const authUrl = `${ENV.API_URL}/auth/google?platform=mobile`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, ENV.OAUTH_REDIRECT_SCHEME);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code;

      if (typeof code === 'string' && code) {
        const res = await authApi.exchangeOAuthCode(code);
        await setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
        await setStoredUser(res.user);
        setUser(res.user);
      } else {
        throw new Error('No authorization code found in redirect URL');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      // User cancelled login flow
    } else {
      throw new Error(`Google login was unsuccessful: ${result.type}`);
    }
  };

  const logout = async () => {
    const { refreshToken } = await getTokens();
    try {
      await authApi.logout(refreshToken);
    } catch (err) {
      console.warn('Logout API failed:', err);
    } finally {
      await clearTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getCurrentUser();
      setUser(freshUser);
      await setStoredUser(freshUser);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
