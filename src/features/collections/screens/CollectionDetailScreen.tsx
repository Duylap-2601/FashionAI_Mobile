import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { COLORS, SPACING } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import type { IProduct } from '@/features/products/types/product';
import { CollectionDetailHeader } from '../components/CollectionDetailHeader';
import { CollectionSkeleton } from '../components/CollectionSkeleton';
import { useCollection } from '../hooks/useCollection';
import { useCollectionProducts } from '../hooks/useCollectionProducts';

type CollectionDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CollectionDetail'
>;

export function CollectionDetailScreen({
  navigation,
  route,
}: CollectionDetailScreenProps) {
  const slug = route.params.slug.trim();
  const { width } = useWindowDimensions();
  const collectionQuery = useCollection(slug);
  const collection = collectionQuery.data;
  const productsQuery = useCollectionProducts(collection?.id);
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [productsQuery.data],
  );
  const productTotal =
    productsQuery.data?.pages[0]?.meta.total ?? collection?.productCount ?? 0;
  const cardWidth = Math.max(
    1,
    (width - SPACING.lg * 2 - SPACING.catalogGap) / 2,
  );
  const isNotFound =
    collectionQuery.error instanceof ApiError &&
    collectionQuery.error.statusCode === 404;

  const handleProductPress = useCallback(
    (productId: string) => {
      navigation.navigate('ProductDetail', { productId });
    },
    [navigation],
  );

  const renderProduct = useCallback<ListRenderItem<IProduct>>(
    ({ item }) => (
      <ProductCard
        presentation="catalog"
        product={item}
        cardWidth={cardWidth}
        onPress={handleProductPress}
      />
    ),
    [cardWidth, handleProductPress],
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([collectionQuery.refetch(), productsQuery.refetch()]);
  }, [collectionQuery, productsQuery]);

  const handleEndReached = useCallback(() => {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      void productsQuery.fetchNextPage();
    }
  }, [productsQuery]);

  if (!slug) {
    return (
      <ErrorView
        fullscreen
        title="Không thể mở bộ sưu tập"
        message="Thông tin bộ sưu tập không hợp lệ. Vui lòng quay lại và thử lần nữa."
      />
    );
  }

  if (collectionQuery.isLoading && !collection) {
    return (
      <View className="flex-1 bg-surface-lowest">
        <CollectionSkeleton />
      </View>
    );
  }

  if (isNotFound) {
    return (
      <EmptyState
        fullscreen
        icon="◇"
        title="Không tìm thấy bộ sưu tập"
        description="Bộ sưu tập có thể chưa được công bố hoặc không còn tồn tại."
        actionTitle="Quay lại trang chủ"
        onAction={navigation.goBack}
      />
    );
  }

  if (collectionQuery.isError && !collection) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải bộ sưu tập"
        message="Vui lòng kiểm tra kết nối và thử lại."
        onRetry={() => void collectionQuery.refetch()}
      />
    );
  }

  if (!collection) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể hiển thị bộ sưu tập"
        message="Vui lòng quay lại trang chủ và thử lần nữa."
      />
    );
  }

  const header = (
    <>
      {collectionQuery.isError ||
      (productsQuery.isError && products.length > 0) ? (
        <View
          accessibilityRole="alert"
          className="m-lg min-h-12 flex-row items-center gap-md rounded-md bg-catalog-muted p-md"
        >
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-on-surface-variant">
            Chưa thể cập nhật nội dung mới nhất. Dữ liệu đã tải vẫn được giữ
            lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleRefresh}
            className="min-h-11 min-w-11 items-center justify-center px-sm active:opacity-70"
          >
            <Text className="font-sans text-body-sm font-bold text-primary-container">
              Thử lại
            </Text>
          </Pressable>
        </View>
      ) : null}
      <CollectionDetailHeader
        collection={collection}
        productTotal={productTotal}
      />
    </>
  );

  return (
    <View className="flex-1 bg-surface-lowest">
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(product) => product.id}
        numColumns={2}
        ListHeaderComponent={header}
        ListEmptyComponent={
          productsQuery.isLoading ? (
            <ProductGridSkeleton presentation="catalog" cardWidth={cardWidth} />
          ) : productsQuery.isError ? (
            <ErrorView
              title="Chưa thể tải sản phẩm"
              message="Vui lòng kiểm tra kết nối và thử lại."
              onRetry={() => void productsQuery.refetch()}
            />
          ) : (
            <EmptyState
              icon="◇"
              title="Bộ sưu tập chưa có sản phẩm"
              description="Các thiết kế mới sẽ được cập nhật tại đây."
            />
          )
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <View className="min-h-16 flex-row items-center justify-center gap-sm">
              <ActivityIndicator color={COLORS.primaryContainer} />
              <Text className="font-sans text-body-sm text-catalog-muted-text">
                Đang tải thêm...
              </Text>
            </View>
          ) : (
            <View className="h-xxl" />
          )
        }
        ItemSeparatorComponent={() => <View className="h-lg" />}
        columnWrapperClassName="items-start gap-catalog-gap px-lg"
        contentContainerClassName="grow"
        contentInsetAdjustmentBehavior="automatic"
        refreshing={
          collectionQuery.isRefetching ||
          (productsQuery.isRefetching && !productsQuery.isFetchingNextPage)
        }
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
