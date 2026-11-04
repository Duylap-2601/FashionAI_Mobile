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
import { COLORS, SPACING } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ProductGridSkeleton } from '@/features/products/components/ProductGridSkeleton';
import { ProductsEmptyState } from '@/features/products/components/ProductsEmptyState';
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

  // Full-screen states: one ivory block with a serif title, one sentence and
  // at most one action (FE States), centred on paper.
  if (!slug) {
    return (
      <View className="flex-1 justify-center bg-landing-paper">
        <ProductsEmptyState
          title="Không thể mở bộ sưu tập"
          description="Thông tin bộ sưu tập không hợp lệ. Vui lòng quay lại và thử lần nữa."
        />
      </View>
    );
  }

  if (collectionQuery.isLoading && !collection) {
    return (
      <View className="flex-1 bg-landing-paper">
        <CollectionSkeleton />
      </View>
    );
  }

  if (isNotFound) {
    return (
      <View className="flex-1 justify-center bg-landing-paper">
        <ProductsEmptyState
          title="Không tìm thấy bộ sưu tập"
          description="Bộ sưu tập có thể chưa được công bố hoặc không còn tồn tại."
          actionTitle="Quay lại trang chủ"
          onAction={navigation.goBack}
        />
      </View>
    );
  }

  if (collectionQuery.isError && !collection) {
    return (
      <View className="flex-1 justify-center bg-landing-paper">
        <ProductsEmptyState
          title="Chưa thể tải bộ sưu tập"
          description="Vui lòng kiểm tra kết nối và thử lại."
          actionTitle="Thử lại"
          onAction={() => void collectionQuery.refetch()}
        />
      </View>
    );
  }

  if (!collection) {
    return (
      <View className="flex-1 justify-center bg-landing-paper">
        <ProductsEmptyState
          title="Chưa thể hiển thị bộ sưu tập"
          description="Vui lòng quay lại trang chủ và thử lần nữa."
        />
      </View>
    );
  }

  const header = (
    <>
      {collectionQuery.isError ||
      (productsQuery.isError && products.length > 0) ? (
        <View
          accessibilityRole="alert"
          className="mx-lg mt-lg min-h-12 flex-row items-center gap-md rounded-subtle border border-landing-line bg-landing-ivory p-md"
        >
          <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
            Chưa thể cập nhật nội dung mới nhất. Dữ liệu đã tải vẫn được giữ
            lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử tải lại bộ sưu tập"
            onPress={handleRefresh}
            className="min-h-11 min-w-11 items-center justify-center px-sm active:opacity-70"
          >
            <Text className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-landing-oxblood">
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
    <View className="flex-1 bg-landing-paper">
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
            <ProductsEmptyState
              title="Chưa thể tải sản phẩm"
              description="Vui lòng kiểm tra kết nối và thử lại."
              actionTitle="Thử lại"
              onAction={() => void productsQuery.refetch()}
            />
          ) : (
            <ProductsEmptyState
              title="Bộ sưu tập chưa có sản phẩm"
              description="Các thiết kế mới sẽ được cập nhật tại đây."
            />
          )
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <View className="min-h-16 flex-row items-center justify-center gap-sm">
              <ActivityIndicator color={COLORS.oxblood} />
              <Text
                accessibilityLiveRegion="polite"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted"
              >
                Đang tải thêm
              </Text>
            </View>
          ) : products.length > 0 && !productsQuery.hasNextPage ? (
            <Text className="mx-lg mb-xxl mt-xxl border-t border-landing-line pt-xxl text-center font-mono text-[11px] uppercase tracking-[0.2em] text-landing-muted">
              Đã xem hết {productTotal.toLocaleString('vi-VN')} sản phẩm
            </Text>
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
