import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth.api';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
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
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('TryOnTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.featureIcon}>👗</Text>
          <Text style={styles.featureName}>Virtual Try-On</Text>
          <Text style={styles.featureDesc}>Thử trang phục với ảnh người thật bằng AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('StylistTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.featureIcon}>✨</Text>
          <Text style={styles.featureName}>AI Stylist</Text>
          <Text style={styles.featureDesc}>Tư vấn phối đồ và phong cách cá nhân</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceLowest,
  },
  greeting: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
  },
  userName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold as any,
    color: COLORS.onSurface,
  },
  tierBadge: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  tierText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold as any,
    letterSpacing: 0.5,
  },
  quotaCard: {
    margin: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceLine,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  quotaTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold as any,
    color: COLORS.onSurface,
  },
  quotaSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  quotaStatsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLine,
  },
  quotaStat: {
    flex: 1,
    alignItems: 'center',
  },
  quotaStatNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.heavy as any,
    color: COLORS.primaryContainer,
  },
  quotaStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  quotaLoading: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.outline,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold as any,
    color: COLORS.onSurface,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  featureGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceLine,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm + 2,
  },
  featureName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold as any,
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
    lineHeight: 16,
  },
});
