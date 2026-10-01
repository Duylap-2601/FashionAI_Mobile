import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/api/auth.api';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { CollectionCarousel } from '@/features/collections/components/CollectionCarousel';
import { CollectionHeroCard } from '@/features/collections/components/CollectionHeroCard';
import { CollectionSkeleton } from '@/features/collections/components/CollectionSkeleton';
import { usePublishedCollections } from '@/features/collections/hooks/usePublishedCollections';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { user } = useAuth();
  const [quota, setQuota] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const collectionsQuery = usePublishedCollections();
  const collections = useMemo(
    () => collectionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [collectionsQuery.data],
  );
  const featuredCollection = collections[0] ?? null;
  const remainingCollections = collections.slice(1);

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
    await Promise.all([fetchQuota(), collectionsQuery.refetch()]);
    setRefreshing(false);
  };

  const handleCollectionPress = useCallback(
    (slug: string) => {
      navigation.navigate('CollectionDetail', { slug });
    },
    [navigation],
  );

  const handleCollectionsEndReached = useCallback(() => {
    if (
      collectionsQuery.hasNextPage &&
      !collectionsQuery.isFetchingNextPage
    ) {
      void collectionsQuery.fetchNextPage();
    }
  }, [collectionsQuery]);

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

      <View style={styles.collectionSection}>
        <View style={styles.collectionHeading}>
          <Text style={styles.collectionKicker}>KHÁM PHÁ PHONG CÁCH</Text>
          <Text style={styles.collectionTitle}>Bộ sưu tập nổi bật</Text>
          <Text style={styles.collectionIntro}>
            Những thiết kế đã được công bố, sẵn sàng để bạn khám phá.
          </Text>
        </View>

        {collectionsQuery.isLoading && collections.length === 0 ? (
          <CollectionSkeleton />
        ) : collectionsQuery.isError && collections.length === 0 ? (
          <ErrorView
            title="Chưa thể tải bộ sưu tập"
            message="Vui lòng kiểm tra kết nối và thử lại."
            onRetry={() => void collectionsQuery.refetch()}
          />
        ) : collections.length === 0 ? (
          <EmptyState
            icon="◇"
            title="Chưa có bộ sưu tập"
            description="Các bộ sưu tập mới sẽ được cập nhật tại đây."
          />
        ) : (
          <>
            {collectionsQuery.isError ? (
              <View accessibilityRole="alert" style={styles.collectionError}>
                <Text style={styles.collectionErrorText}>
                  Chưa thể cập nhật danh sách mới nhất.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.68}
                  onPress={() => void collectionsQuery.refetch()}
                  style={styles.collectionRetry}
                >
                  <Text style={styles.collectionRetryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {featuredCollection ? (
              <View style={styles.heroWrap}>
                <CollectionHeroCard
                  collection={featuredCollection}
                  onPress={handleCollectionPress}
                />
              </View>
            ) : null}

            {remainingCollections.length > 0 ? (
              <View style={styles.moreCollections}>
                <Text style={styles.moreCollectionsTitle}>
                  Khám phá thêm
                </Text>
                <CollectionCarousel
                  collections={remainingCollections}
                  isFetchingNextPage={collectionsQuery.isFetchingNextPage}
                  onEndReached={handleCollectionsEndReached}
                  onPressCollection={handleCollectionPress}
                />
              </View>
            ) : null}
          </>
        )}
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
    backgroundColor: COLORS.commerceSurface,
  },
  collectionSection: {
    gap: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  collectionHeading: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  collectionKicker: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1.1,
    color: COLORS.primaryContainer,
  },
  collectionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  collectionIntro: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
  },
  heroWrap: {
    paddingHorizontal: SPACING.lg,
  },
  moreCollections: {
    gap: SPACING.md,
  },
  moreCollectionsTitle: {
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.onSurface,
  },
  collectionError: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLow,
  },
  collectionErrorText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
  },
  collectionRetry: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  collectionRetryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
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
