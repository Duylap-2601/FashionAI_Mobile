import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../../auth/useAuth';
import { authApi } from '../../api/auth.api';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [quota, setQuota] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuota = async () => {
    try {
      const data = await authApi.getUserQuota();
      setQuota(data);
    } catch (err) {
      console.warn('Failed to load quota:', err);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuota();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.name || user?.email || 'Người dùng'}</Text>
        </View>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{user?.tier || 'FREE'}</Text>
        </View>
      </View>

      {/* Quota Card */}
      <View style={styles.quotaCard}>
        <Text style={styles.quotaTitle}>Hạn mức AI hôm nay</Text>
        <Text style={styles.quotaSub}>
          Virtual Try-On & AI Stylist được cấp theo gói dịch vụ của bạn.
        </Text>
        {quota ? (
          <View style={styles.quotaStatsRow}>
            <View style={styles.quotaStat}>
              <Text style={styles.quotaStatNumber}>{quota.remaining ?? '-'}</Text>
              <Text style={styles.quotaStatLabel}>Lượt còn lại</Text>
            </View>
            <View style={styles.quotaStat}>
              <Text style={styles.quotaStatNumber}>{quota.limit ?? '-'}</Text>
              <Text style={styles.quotaStatLabel}>Tổng hạn mức</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.quotaLoading}>Đang cập nhật hạn mức...</Text>
        )}
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>👗</Text>
          <Text style={styles.featureName}>Virtual Try-On</Text>
          <Text style={styles.featureDesc}>Thử trang phục với ảnh người thật bằng AI</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>✨</Text>
          <Text style={styles.featureName}>AI Stylist</Text>
          <Text style={styles.featureDesc}>Tư vấn phối đồ và phong cách cá nhân</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  tierBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quotaCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  quotaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  quotaSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  quotaStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  quotaStat: {
    flex: 1,
    alignItems: 'center',
  },
  quotaStatNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563eb',
  },
  quotaStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  quotaLoading: {
    marginTop: 12,
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
});
