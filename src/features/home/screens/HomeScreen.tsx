import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { CollectionCarousel } from '@/features/collections/components/CollectionCarousel';
import { CollectionSkeleton } from '@/features/collections/components/CollectionSkeleton';
import { usePublishedCollections } from '@/features/collections/hooks/usePublishedCollections';
import { useCollectionProducts } from '@/features/collections/hooks/useCollectionProducts';
import { useProducts } from '@/features/products/hooks/useProducts';
import { OnboardingModal } from '@/features/auth/components/OnboardingModal';

import { AnnouncementBar } from '../components/AnnouncementBar';
import { HomeHeroBanner } from '../components/HomeHeroBanner';
import { SaleBannerText } from '../components/SaleBannerText';
import { HomeProductSection } from '../components/HomeProductSection';
import { EditorialLookbook } from '../components/EditorialLookbook';
import { AiTryOnFeatureBanner } from '../components/AiTryOnFeatureBanner';
import { NewsletterBar } from '../components/NewsletterBar';
import type { IProduct } from '@/features/products/types/product';
import type { Collection } from '@/features/collections/types/collection';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function getTrendingScore(product: IProduct): number {
  let score = 0;
  if (product.reviewCount && product.reviewCount > 0) {
    score += product.reviewCount * 50;
  }
  if (product.avgRating && product.avgRating > 0) {
    score += product.avgRating * 10;
  }
  const nameLower = (product.name || '').toLowerCase();
  const garmentType = (product as any).garmentType || '';
  if (nameLower.includes('blazer') || garmentType === 'JACKET') score += 15;
  if (nameLower.includes('vest') || garmentType === 'VEST') score += 12;
  if (nameLower.includes('đầm') || garmentType === 'DRESS') score += 10;
  if (nameLower.includes('combo')) score += 8;

  return score;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const [refreshing, setRefreshing] = useState(false);

  // 1. Collections Query
  const collectionsQuery = usePublishedCollections();
  const collections = useMemo(
    () => collectionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [collectionsQuery.data],
  );

  // Selected collection for interactive filtering (defaults to collections[0])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const selectedCollection = useMemo(() => {
    if (selectedCollectionId) {
      const found = collections.find((c) => c.id === selectedCollectionId);
      if (found) return found;
    }
    return collections[0] ?? null;
  }, [collections, selectedCollectionId]);

  // 2. Collection Products Query
  const collectionProductsQuery = useCollectionProducts(selectedCollection?.id);
  const collectionProducts = useMemo(
    () => collectionProductsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [collectionProductsQuery.data],
  );

  // 3. Catalog Products (for Best Sellers / Trending)
  const catalogQuery = useProducts({ limit: 12 });
  const allCatalogProducts = useMemo(
    () => catalogQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [catalogQuery.data],
  );

  const bestSellers = useMemo(() => {
    return [...allCatalogProducts]
      .sort((a, b) => getTrendingScore(b) - getTrendingScore(a))
      .slice(0, 8);
  }, [allCatalogProducts]);

  // Fallback products if collection products are empty
  const displayCollectionProducts =
    collectionProducts.length > 0
      ? collectionProducts
      : allCatalogProducts.slice(0, 6);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      collectionsQuery.refetch(),
      catalogQuery.refetch(),
      ...(selectedCollection ? [collectionProductsQuery.refetch()] : []),
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
    (productId: string) => {
      navigation.navigate('ProductDetail', { productId });
    },
    [navigation],
  );

  const handleTryOnPress = useCallback(() => {
    navigation.navigate('TryOnTab');
  }, [navigation]);

  const handleShopPress = useCallback(() => {
    navigation.navigate('ShopTab');
  }, [navigation]);

  const handleCollectionsEndReached = useCallback(() => {
    if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage) {
      void collectionsQuery.fetchNextPage();
    }
  }, [collectionsQuery]);

  return (
    <ScrollView
      className="flex-1 bg-surface-lowest"
      contentContainerClassName="pb-16"
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
      {/* 1. Announcement Bar (Top Rotator) */}
      <AnnouncementBar
        onPressTryOn={handleTryOnPress}
        onPressShop={handleShopPress}
      />

      {/* Loading / Error States for Collections */}
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
          {collectionsQuery.isError && (
            <View
              accessibilityRole="alert"
              className="m-4 min-h-12 flex-row items-center gap-3 rounded-md bg-catalog-muted p-3"
            >
              <Text className="flex-1 font-sans text-body-sm text-on-surface-variant">
                Chưa thể cập nhật danh sách mới nhất.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={() => void collectionsQuery.refetch()}
                className="justify-center px-2 py-1"
              >
                <Text className="font-sans text-body-sm font-bold text-primary-container">
                  Thử lại
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Hero Banner (Collections Slider) */}
          <HomeHeroBanner
            collections={collections}
            onPressCollection={handleCollectionPress}
            onPressTryOn={handleTryOnPress}
          />

          {/* 3. Collection Carousel (Horizontal) */}
          <View className="border-b border-catalog-line bg-surface-lowest py-14">
            <View className="mb-xxxl gap-md px-lg">
              <Text className="font-sans text-label-md font-bold uppercase tracking-widest text-primary-container">
                BỘ SƯU TẬP ĐỘC QUYỀN
              </Text>
              <Text className="font-sans text-headline-lg font-bold uppercase tracking-tight text-on-surface-strong">
                Bộ sưu tập mới nhất
              </Text>
              <Text className="font-sans text-body-md leading-relaxed text-catalog-muted-text">
                Được thiết kế tinh xảo theo từng mùa thời trang, định hình phong cách quý cô và quý ông hiện đại.
              </Text>
            </View>

            <CollectionCarousel
              collections={collections}
              selectedCollectionId={selectedCollection?.id}
              isFetchingNextPage={collectionsQuery.isFetchingNextPage}
              onEndReached={handleCollectionsEndReached}
              onPressCollection={handleCollectionPress}
              onSelectCollection={(col: Collection) => setSelectedCollectionId(col.id)}
            />
          </View>

          {/* 4. Sale Banner Text */}
          <SaleBannerText
            onPressShop={handleShopPress}
            onPressTryOn={handleTryOnPress}
          />

          {/* 5. Featured Products (From Selected Collection) */}
          <HomeProductSection
            badge="BỘ SƯU TẬP"
            title={
              selectedCollection
                ? `THIẾT KẾ: ${selectedCollection.name}`
                : 'SẢN PHẨM MỚI NHẤT'
            }
            subtitle={
              selectedCollection?.description ||
              'Chuẩn dáng từ đầu, đẹp từng đường may'
            }
            products={displayCollectionProducts}
            isLoading={collectionProductsQuery.isPending}
            isError={collectionProductsQuery.isError}
            onRetry={() => void collectionProductsQuery.refetch()}
            showCategories={true}
            onPressProduct={handleProductPress}
            onPressViewAll={handleShopPress}
          />

          {/* 6. Editorial Lookbook */}
          <EditorialLookbook
            collection={selectedCollection}
            onPressTryOn={handleTryOnPress}
          />

          {/* 7. Best Sellers / Top Trending Products */}
          <HomeProductSection
            badge="TOP TRENDING"
            title="SẢN PHẨM BÁN CHẠY NHẤT"
            subtitle="Được khách hàng và stylist tin chọn nhiều nhất trong tháng"
            products={bestSellers}
            isLoading={catalogQuery.isPending}
            isError={catalogQuery.isError}
            onRetry={() => void catalogQuery.refetch()}
            showCategories={false}
            onPressProduct={handleProductPress}
            onPressViewAll={handleShopPress}
          />

          {/* 8. AI Try-On Feature Banner */}
          <AiTryOnFeatureBanner
            onPressTryOn={handleTryOnPress}
          />

          {/* 9. Newsletter Bar & Brand Footer */}
          <NewsletterBar />
        </>
      )}

      {/* 10. First-time Onboarding Modal */}
      <OnboardingModal />
    </ScrollView>
  );
};
