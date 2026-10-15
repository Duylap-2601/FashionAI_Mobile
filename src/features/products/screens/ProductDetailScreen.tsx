import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { usePinProductToRack } from '@/features/rack/hooks/useRack';
import { ProductDetailActionBar } from '../components/ProductDetailActionBar';
import { ProductDetailContent } from '../components/ProductDetailContent';
import { ProductDetailSkeleton } from '../components/ProductDetailSkeleton';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { useProduct } from '../hooks/useProduct';
import {
  getProductImageUrls,
  getProductMainImage,
} from '../utils/product-display';

type ProductDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProductDetail'
>;

function getInitialColor(
  colors?: { name: string }[] | null,
  color?: string | null,
): string | null {
  const firstColor = colors?.find((item) => item.name.trim())?.name.trim();
  return firstColor ?? color?.trim() ?? null;
}

export function ProductDetailScreen({
  navigation,
  route,
}: ProductDetailScreenProps) {
  const productId = route.params.productId.trim();
  const addItem = useCartStore((state) => state.addItem);
  const productQuery = useProduct(productId);
  const pinToRackMutation = usePinProductToRack();
  const product = productQuery.data;
  const [colorSelection, setColorSelection] = useState<{
    productId: string;
    color: string | null;
  } | null>(null);
  const selectedColor =
    colorSelection && colorSelection.productId === product?.id
      ? colorSelection.color
      : getInitialColor(product?.colors, product?.color);

  const imageUrls = useMemo(
    () => (product ? getProductImageUrls(product) : []),
    [product],
  );
  const mainImageUrl = useMemo(
    () => (product ? getProductMainImage(product) : null),
    [product],
  );
  const unavailable = product?.status !== 'ACTIVE';
  const isNotFound =
    productQuery.error instanceof ApiError &&
    productQuery.error.statusCode === 404;

  const handleReviewsPress = useCallback(() => {
    navigation.navigate('Reviews', { productId });
  }, [navigation, productId]);

  const handleSelectColor = useCallback(
    (color: string) => {
      if (product) {
        setColorSelection({ productId: product.id, color });
      }
    },
    [product],
  );

  const handleTryOn = useCallback(() => {
    if (!product) return;
    navigation.navigate('Main', {
      screen: 'TryOnTab',
      params: {
        screen: 'TryOnHome',
        params: {
          productId: String(product.id),
          productName: product.name,
          productImageUrl: mainImageUrl ?? undefined,
          category: product.category,
        },
      },
    });
  }, [navigation, product, mainImageUrl]);

  const handleAddToCart = useCallback(() => {
    if (!product || product.status !== 'ACTIVE') {
      return;
    }

    addItem({
      productId: product.id,
      productName: product.name,
      color: selectedColor ?? undefined,
      quantity: 1,
      price: product.price,
      imageUrl: mainImageUrl ?? undefined,
    });

    Alert.alert(
      'Đã thêm vào giỏ hàng',
      `${product.name}${selectedColor ? ` · Màu ${selectedColor}` : ''}`,
    );
  }, [addItem, mainImageUrl, product, selectedColor]);

  const handleSaveToRack = useCallback(() => {
    if (!product) {
      return;
    }

    void pinToRackMutation
      .mutateAsync(product.id)
      .then(() => {
        Alert.alert(
          'Đã lưu vào Tủ đồ',
          `${product.name} đã có trong Tủ đồ của bạn.`,
        );
      })
      .catch((error: unknown) => {
        Alert.alert(
          'Chưa thể lưu vào Tủ đồ',
          error instanceof ApiError
            ? error.message
            : 'Đã xảy ra lỗi. Vui lòng thử lại.',
        );
      });
  }, [pinToRackMutation, product]);

  if (!productId) {
    return (
      <ErrorView
        fullscreen
        title="Không thể mở sản phẩm"
        message="Thông tin sản phẩm không hợp lệ. Vui lòng quay lại và thử lần nữa."
      />
    );
  }

  if (productQuery.isLoading && !product) {
    return <ProductDetailSkeleton />;
  }

  if (isNotFound) {
    return (
      <EmptyState
        fullscreen
        icon="◇"
        title="Không tìm thấy sản phẩm"
        description="Sản phẩm có thể đã ngừng hiển thị hoặc không còn tồn tại."
        actionTitle="Quay lại cửa hàng"
        onAction={navigation.goBack}
      />
    );
  }

  if (productQuery.isError && !product) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể tải sản phẩm"
        message="Vui lòng kiểm tra kết nối và thử lại."
        onRetry={() => void productQuery.refetch()}
      />
    );
  }

  if (!product) {
    return (
      <ErrorView
        fullscreen
        title="Chưa thể hiển thị sản phẩm"
        message="Vui lòng quay lại cửa hàng và thử lần nữa."
      />
    );
  }

  return (
    <View className="flex-1 bg-surface-lowest">
      <ScrollView
        contentContainerClassName="pb-xxl"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={productQuery.isFetching}
            tintColor={COLORS.primaryContainer}
            colors={[COLORS.primaryContainer]}
            onRefresh={() => void productQuery.refetch()}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {productQuery.isError ? (
          <View
            accessibilityRole="alert"
            className="mx-lg mt-lg min-h-12 flex-row items-center gap-md rounded-md bg-catalog-muted p-md"
          >
            <Text className="flex-1 font-sans text-body-sm leading-relaxed text-on-surface-variant">
              Chưa thể cập nhật thông tin mới nhất. Nội dung đã tải vẫn được giữ
              lại.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thử tải lại thông tin sản phẩm"
              onPress={() => void productQuery.refetch()}
              className="min-h-11 min-w-11 items-center justify-center px-sm active:opacity-70"
            >
              <Text className="font-sans text-body-sm font-bold text-primary-container">
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : null}

        <ProductImageGallery imageUrls={imageUrls} productName={product.name} />
        <ProductDetailContent
          product={product}
          rackAction={
            <Button
              title="Lưu vào Tủ đồ"
              variant="outline"
              loading={pinToRackMutation.isPending}
              onPress={handleSaveToRack}
            />
          }
          selectedColor={selectedColor}
          unavailable={unavailable}
          onReviewsPress={handleReviewsPress}
          onSelectColor={handleSelectColor}
        />
      </ScrollView>

      <ProductDetailActionBar
        canPurchase={!unavailable}
        onAddToCart={handleAddToCart}
        onTryOn={handleTryOn}
      />
    </View>
  );
}
