import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
} from '@/constants/theme';
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
    Math.floor((width - SPACING.lg * 2 - SPACING.md) / 2),
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
      <View style={styles.screen}>
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
      {collectionQuery.isError || (productsQuery.isError && products.length > 0) ? (
        <View accessibilityRole="alert" style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>
            Chưa thể cập nhật nội dung mới nhất. Dữ liệu đã tải vẫn được giữ lại.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleRefresh}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.retryText}>Thử lại</Text>
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
    <View style={styles.screen}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(product) => product.id}
        numColumns={2}
        ListHeaderComponent={header}
        ListEmptyComponent={
          productsQuery.isLoading ? (
            <ProductGridSkeleton cardWidth={cardWidth} />
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
            <View style={styles.footerLoading}>
              <ActivityIndicator color={COLORS.primaryContainer} />
              <Text style={styles.footerText}>Đang tải thêm...</Text>
            </View>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        columnWrapperStyle={products.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.commerceSurface,
  },
  listContent: {
    flexGrow: 1,
  },
  columnWrapper: {
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  rowSeparator: {
    height: SPACING.xl,
  },
  inlineError: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLow,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    color: COLORS.onSurfaceVariant,
  },
  retryText: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    textAlignVertical: 'center',
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryContainer,
  },
  pressed: {
    opacity: 0.68,
  },
  footerLoading: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.onSurfaceVariant,
  },
  footerSpace: {
    height: SPACING.xxl,
  },
});

