import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Shirt, Sparkles } from 'lucide-react-native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { authApi } from '@/features/auth/api/auth.api';
import { COLORS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { CollectionCarousel } from '@/features/collections/components/CollectionCarousel';
import { CollectionHeroCard } from '@/features/collections/components/CollectionHeroCard';
import { CollectionSkeleton } from '@/features/collections/components/CollectionSkeleton';
import { usePublishedCollections } from '@/features/collections/hooks/usePublishedCollections';
import { useCollectionProducts } from '@/features/collections/hooks/useCollectionProducts';
import { HomeFeaturedProducts } from '../components/HomeFeaturedProducts';

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
  const featuredProductsQuery = useCollectionProducts(featuredCollection?.id);
  const featuredProducts = useMemo(
    () =>
      featuredProductsQuery.data?.pages
        .flatMap((page) => page.data)
        .slice(0, 4) ?? [],
    [featuredProductsQuery.data],
  );

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
    await Promise.all([
      fetchQuota(),
      collectionsQuery.refetch(),
      ...(featuredCollection ? [featuredProductsQuery.refetch()] : []),
    ]);
    setRefreshing(false);
  };

  const handleCollectionPress = useCallback(
    (slug: string) => {
      navigation.navigate('CollectionDetail', { slug });
    },
    [navigation],
  );

  const handleProductPress = useCallback(
    (productId: string) => navigation.navigate('ProductDetail', { productId }),
    [navigation],
  );

  const handleCollectionsEndReached = useCallback(() => {
    if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage) {
      void collectionsQuery.fetchNextPage();
    }
  }, [collectionsQuery]);

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerClassName="pb-giant"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primaryContainer}
          colors={[COLORS.primaryContainer]}
        />
      }
    >
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
            <View
              accessibilityRole="alert"
              className="m-lg min-h-12 flex-row items-center gap-md rounded-md bg-catalog-muted p-md"
            >
              <Text className="flex-1 font-sans text-body-sm text-on-surface-variant">
                Chưa thể cập nhật danh sách mới nhất.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.68}
                onPress={() => void collectionsQuery.refetch()}
                className="min-h-11 min-w-11 justify-center px-sm"
              >
                <Text className="font-sans text-body-sm font-bold text-primary-container">
                  Thử lại
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {featuredCollection ? (
            <View className="bg-editorial-background px-lg pb-giant pt-xxxl">
              <CollectionHeroCard
                collection={featuredCollection}
                onPress={handleCollectionPress}
                onTryOnPress={() => navigation.navigate('TryOnTab')}
              />
            </View>
          ) : null}
          <View className="gap-xxxl border-b border-catalog-line py-14">
            <View className="gap-sm px-lg">
              <Text className="font-sans text-label-md uppercase tracking-widest text-primary-container">
                BỘ SƯU TẬP ĐỘC QUYỀN
              </Text>
              <Text className="font-sans text-headline-lg font-bold uppercase text-on-surface-strong">
                Bộ sưu tập mới nhất
              </Text>
              <Text className="font-sans text-body-md text-catalog-muted-text">
                Những thiết kế đã được công bố, sẵn sàng để bạn khám phá.
              </Text>
            </View>
            <CollectionCarousel
              collections={collections}
              isFetchingNextPage={collectionsQuery.isFetchingNextPage}
              onEndReached={handleCollectionsEndReached}
              onPressCollection={handleCollectionPress}
            />
          </View>
          {featuredCollection ? (
            <HomeFeaturedProducts
              collection={featuredCollection}
              products={featuredProducts}
              isLoading={featuredProductsQuery.isPending}
              isError={featuredProductsQuery.isError}
              onRetry={() => void featuredProductsQuery.refetch()}
              onPressCollection={handleCollectionPress}
              onPressProduct={handleProductPress}
            />
          ) : null}
        </>
      )}

      <View className="gap-xxl bg-catalog-muted px-lg py-giant">
        <View className="flex-row items-center justify-between gap-lg">
          <View className="flex-1 gap-xs">
            <Text className="font-sans text-body-sm text-catalog-muted-text">
              Xin chào,
            </Text>
            <Text className="font-sans text-headline-md text-primary-container">
              {user?.name || user?.email || 'Người dùng'}
            </Text>
          </View>
          <View className="rounded-full border border-surface-line bg-surface-lowest px-md py-sm">
            <Text className="font-sans text-label-md tracking-wide text-primary-container">
              {user?.tier || 'FREE'}
            </Text>
          </View>
        </View>
        <Card
          variant="outlined"
          className="!rounded-catalog-gallery !border-catalog-line !p-xl"
        >
          <Text className="font-sans text-headline-sm text-primary-container">
            Hạn mức AI hôm nay
          </Text>
          <Text className="mt-sm font-sans text-body-sm leading-relaxed text-catalog-muted-text">
            Virtual Try-On & AI Stylist được cấp theo gói dịch vụ của bạn.
          </Text>
          {quota ? (
            <View className="mt-lg flex-row border-t border-catalog-line pt-lg">
              <View className="flex-1 items-center">
                <Text className="font-sans text-headline-lg text-primary-container">
                  {quota.remaining ?? '-'}
                </Text>
                <Text className="mt-xs font-sans text-body-sm text-catalog-muted-text">
                  Lượt còn lại
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="font-sans text-headline-lg text-primary-container">
                  {quota.limit ?? '-'}
                </Text>
                <Text className="mt-xs font-sans text-body-sm text-catalog-muted-text">
                  Tổng hạn mức
                </Text>
              </View>
            </View>
          ) : (
            <Text className="mt-md font-sans text-body-sm italic text-catalog-muted-text">
              Đang cập nhật hạn mức...
            </Text>
          )}
        </Card>
        <Text className="font-sans text-headline-sm text-primary-container">
          Tính năng nổi bật
        </Text>
        <View className="flex-row items-stretch gap-md">
          <TouchableOpacity
            className="min-h-11 flex-1 gap-sm rounded-catalog-gallery border border-catalog-line bg-surface-lowest p-lg"
            onPress={() => navigation.navigate('TryOnTab')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Shirt size={24} color={COLORS.primaryContainer} />
            <Text className="font-sans text-body-lg font-bold text-primary-container">
              Virtual Try-On
            </Text>
            <Text className="font-sans text-body-sm leading-relaxed text-catalog-muted-text">
              Thử trang phục với ảnh người thật bằng AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="min-h-11 flex-1 gap-sm rounded-catalog-gallery bg-primary-container p-lg"
            onPress={() => navigation.navigate('Stylist')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Sparkles size={24} color={COLORS.tertiaryFixed} />
            <Text className="font-sans text-body-lg font-bold text-on-primary">
              AI Stylist
            </Text>
            <Text className="font-sans text-body-sm leading-relaxed text-on-primary/85">
              Phân tích màu sắc, vóc dáng và cách phối đồ
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
