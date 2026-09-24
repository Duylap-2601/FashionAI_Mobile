import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function MainContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Đang tải cấu hình ứng dụng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>FashionAI Mobile</Text>
        <Text style={styles.subtitle}>Cấu hình nền tảng hoàn tất</Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Trạng thái auth:</Text>
          <Text style={styles.statusValue}>
            {isAuthenticated ? `Đã đăng nhập (${user?.email})` : 'Chưa đăng nhập'}
          </Text>
        </View>

        <Text style={styles.note}>
          Môi trường API: {process.env.EXPO_PUBLIC_API_URL || 'Default local'}
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
  },
  statusBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  note: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
