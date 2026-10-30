import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowUpRight } from 'lucide-react-native';
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
import { LandingSectionHeading } from '../components/LandingSectionHeading';
import { HomeProductSection } from '../components/HomeProductSection';
import { EditorialLookbook } from '../components/EditorialLookbook';
import { AiTryOnFeatureBanner } from '../components/AiTryOnFeatureBanner';
import { AiStylistCapsule } from '../components/AiStylistCapsule';
import { LandingFooter } from '../components/LandingFooter';
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
  const scrollRef = useRef<ScrollView>(null);
  const collectionsOffset = useRef(0);

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

  const handleTryOnPress = useCallback(
    (productId?: string) => {
      if (productId) {
        navigation.navigate('TryOnTab', {
          screen: 'TryOnHome',
          params: { productId },
        });
        return;
      }
      navigation.navigate('TryOnTab');
    },
    [navigation],
  );

  const handleStylistPress = useCallback(() => {
    navigation.navigate('StylistTab');
  }, [navigation]);

  const handleShopPress = useCallback(() => {
    navigation.navigate('ShopTab');
  }, [navigation]);

  const handleCollectionsEndReached = useCallback(() => {
    if (collectionsQuery.hasNextPage && !collectionsQuery.isFetchingNextPage) {
      void collectionsQuery.fetchNextPage();
    }
  }, [collectionsQuery]);

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleScrollToCollections = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(collectionsOffset.current - 8, 0),
      animated: true,
    });
  }, []);

  const handleOrdersPress = useCallback(() => {
    navigation.navigate('ProfileTab', { screen: 'Orders' });
  }, [navigation]);

  const handleMeasurementsPress = useCallback(() => {
    navigation.navigate('ProfileTab', {
      screen: 'Measurements',
      params: { tab: 'sizes' },
    });
  }, [navigation]);

  const handlePolicyPress = useCallback(
    (type: 'privacy' | 'terms' | 'return') => {
      navigation.navigate('Policy', { type });
    },
    [navigation],
  );

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 bg-landing-paper"
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
      {/* 1. Announcement Bar */}
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
              className="m-4 min-h-12 flex-row items-center gap-3 rounded-subtle border border-landing-line bg-landing-ivory p-3"
            >
              <Text className="flex-1 font-sans text-body-sm text-landing-muted">
                Chưa thể cập nhật danh sách mới nhất.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={() => void collectionsQuery.refetch()}
                className="justify-center px-2 py-1"
              >
                <Text className="font-sans text-body-sm font-bold text-landing-oxblood">
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

          {/* 3. Collection Carousel (Chapter 02) */}
          <View
            className="bg-landing-paper py-16"
            onLayout={(event) => {
              collectionsOffset.current = event.nativeEvent.layout.y;
            }}
          >
            <View className="px-lg">
              <LandingSectionHeading
                chapter="02"
                eyebrow="BỘ SƯU TẬP"
                title="BỐN CHƯƠNG. MỘT PHONG CÁCH."
                description="Mỗi bộ sưu tập là một lớp cắt may riêng cho nhịp sống công sở. Chọn một chương để xem thiết kế."
                action={
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleShopPress}
                    className="flex-row items-center gap-1.5 active:opacity-75"
                  >
                    <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-oxblood">
                      Xem tất cả
                    </Text>
                    <ArrowUpRight size={14} color="#5D1C34" />
                  </Pressable>
                }
              />
            </View>

            <View className="mt-8">
              <CollectionCarousel
                collections={collections}
                selectedCollectionId={selectedCollection?.id}
                isFetchingNextPage={collectionsQuery.isFetchingNextPage}
                onEndReached={handleCollectionsEndReached}
                onPressCollection={handleCollectionPress}
                onSelectCollection={(col: Collection) => setSelectedCollectionId(col.id)}
              />
            </View>
          </View>

          {/* 4. Featured Products (Chapter 03) */}
          <HomeProductSection
            chapter="03"
            badge="SẢN PHẨM"
            title={
              selectedCollection
                ? selectedCollection.name
                : 'SẢN PHẨM TIÊU BIỂU'
            }
            subtitle={
              selectedCollection?.description ||
              'Chuẩn dáng từ đầu, đẹp từng đường may.'
            }
            products={displayCollectionProducts}
            isLoading={collectionProductsQuery.isPending}
            isError={collectionProductsQuery.isError}
            onRetry={() => void collectionProductsQuery.refetch()}
            showCategories={true}
            onPressProduct={handleProductPress}
            onPressViewAll={handleShopPress}
          />

          {/* 5. Editorial Lookbook (Chapter 04) */}
          <EditorialLookbook
            collection={selectedCollection}
            onPressTryOn={handleTryOnPress}
          />

          {/* 6. AI Try-On Feature Banner (Chapter 05) */}
          <AiTryOnFeatureBanner
            products={displayCollectionProducts}
            onPressTryOn={handleTryOnPress}
          />

          {/* 7. AI Stylist Capsule (Chapter 06) */}
          <AiStylistCapsule
            products={bestSellers}
            onPressStylist={handleStylistPress}
            onPressProduct={handleProductPress}
          />
        </>
      )}

      {/* 8. Brand Footer */}
      <LandingFooter
        onPressHome={handleScrollToTop}
        onPressCollections={handleScrollToCollections}
        onPressShop={handleShopPress}
        onPressTryOn={handleTryOnPress}
        onPressStylist={handleStylistPress}
        onPressOrders={handleOrdersPress}
        onPressMeasurements={handleMeasurementsPress}
        onPressPolicy={handlePolicyPress}
      />

      {/* 9. First-time Onboarding Modal */}
      <OnboardingModal />
    </ScrollView>
  );
};
