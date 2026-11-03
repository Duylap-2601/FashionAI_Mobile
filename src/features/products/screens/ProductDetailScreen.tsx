import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import { ApiError } from '@/types/api';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useCanReviewProduct } from '@/features/reviews/hooks/useCanReviewProduct';
import { ProductDetailActionBar } from '../components/ProductDetailActionBar';
import { ProductDetailContent } from '../components/ProductDetailContent';
import { ProductDetailSkeleton } from '../components/ProductDetailSkeleton';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { useProduct } from '../hooks/useProduct';
import { useLocalCartReady } from '../hooks/use-local-cart-ready';
import { ProductCartButton } from '../components/ProductCartButton';
import {
  getProductImageUrls,
  getProductMainImage,
  resolveProductImageForColor,
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

export function ProductDetailScreen(props: ProductDetailScreenProps) {
  // Reset product-local selections and feedback when this route changes product.
  return <ProductDetail key={props.route.params.productId} {...props} />;
}

function ProductDetail({
  navigation,
  route,
}: ProductDetailScreenProps) {
  const productId = route.params.productId.trim();
  const addItem = useCartStore((state) => state.addItem);
  const cartReady = useLocalCartReady();
  const cartActionLocked = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const reviewsOffset = useRef(0);
  const [cartFeedback, setCartFeedback] = useState<{ productId: string; name: string; color: string | null } | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const closeCartFeedback = useCallback(() => {
    setCartFeedback(null);
    cartActionLocked.current = false;
  }, []);
  const openCart = useCallback(() => {
    closeCartFeedback();
    navigation.navigate('Cart');
  }, [closeCartFeedback, navigation]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center gap-1">
          <NotificationBell />
          <ProductCartButton onPress={openCart} />
        </View>
      ),
    });
  }, [navigation, openCart]);
  const productQuery = useProduct(productId);
  const reviewEligibility = useCanReviewProduct(productId);
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
  const colorImageUrl = useMemo(
    () =>
      product && selectedColor
        ? resolveProductImageForColor(product, selectedColor).url
        : null,
    [product, selectedColor],
  );
  const unavailable = product?.status !== 'ACTIVE';
  const isNotFound =
    productQuery.error instanceof ApiError &&
    productQuery.error.statusCode === 404;

  const handleReviewsPress = useCallback(() => {
    navigation.navigate('Reviews', { productId });
  }, [navigation, productId]);

  const handleWriteReviewPress = useCallback(() => {
    if (reviewEligibility.isLoading) {
      return;
    }

    if (!reviewEligibility.canReview) {
      setReviewNotice(
        reviewEligibility.reason === 'already_reviewed'
          ? 'Bạn đã đánh giá sản phẩm này.'
          : 'Chỉ user đã mua và nhận hàng mới được đánh giá.',
      );
      return;
    }

    navigation.navigate('Reviews', { productId, startWriting: true });
  }, [navigation, productId, reviewEligibility]);

  const handleReviewsSummaryPress = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(reviewsOffset.current - 16, 0),
      animated: true,
    });
  }, []);

  const handleReviewsSectionLayout = useCallback((offsetY: number) => {
    reviewsOffset.current = offsetY;
  }, []);

  const handleMeasurementsPress = useCallback(() => {
    navigation.navigate('Main', {
      screen: 'ProfileTab',
      params: { screen: 'Measurements' },
    });
  }, [navigation]);

  const handleProductPress = useCallback(
    (relatedProductId: string) => {
      navigation.push('ProductDetail', { productId: relatedProductId });
    },
    [navigation],
  );

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

  const handleAskAI = useCallback(() => {
    if (!product) return;
    navigation.navigate('Chat', { productId: String(product.id) });
  }, [navigation, product]);

  const handleAddToCart = useCallback(() => {
    if (!product || product.status !== 'ACTIVE' || !cartReady || cartActionLocked.current) {
      return;
    }
    cartActionLocked.current = true;
    try {
      addItem({
        productId: product.id,
        productName: product.name,
        color: selectedColor ?? undefined,
        quantity: 1,
        price: product.price,
        imageUrl: mainImageUrl ?? undefined,
      });
      setCartFeedback({ productId: product.id, name: product.name, color: selectedColor });
    } catch {
      cartActionLocked.current = false;
      Alert.alert('Chưa thể thêm vào giỏ hàng', 'Vui lòng thử lại.');
    }
  }, [addItem, cartReady, mainImageUrl, product, selectedColor]);

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
    <View className="flex-1 bg-paper">
      <ScrollView
        ref={scrollRef}
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
            className="mx-lg mt-lg min-h-12 flex-row items-center gap-md rounded-subtle border border-landing-line bg-ivory p-md"
          >
            <Text className="flex-1 font-sans text-body-sm leading-relaxed text-landing-muted">
              Chưa thể cập nhật thông tin mới nhất. Nội dung đã tải vẫn được giữ
              lại.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thử tải lại thông tin sản phẩm"
              onPress={() => void productQuery.refetch()}
              className="min-h-11 min-w-11 items-center justify-center px-sm active:opacity-70"
            >
              <Text className="font-sans text-body-sm font-bold text-oxblood">
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : null}

        <ProductImageGallery
          imageUrls={imageUrls}
          focusImageUrl={colorImageUrl}
          productName={product.name}
        />
        <ProductDetailContent
          product={product}
          selectedColor={selectedColor}
          unavailable={unavailable}
          onMeasurementsPress={handleMeasurementsPress}
          onProductPress={handleProductPress}
          onReviewsPress={handleReviewsPress}
          onReviewsSummaryPress={handleReviewsSummaryPress}
          onWriteReviewPress={handleWriteReviewPress}
          onReviewsSectionLayout={handleReviewsSectionLayout}
          onSelectColor={handleSelectColor}
          onAskStylist={handleAskAI}
        />
      </ScrollView>

      <ProductDetailActionBar
        canPurchase={!unavailable}
        cartReady={cartReady}
        onAddToCart={handleAddToCart}
        onTryOn={handleTryOn}
      />
      <FeedbackModal
        visible={cartFeedback !== null && cartFeedback.productId === product.id}
        title="Đã thêm vào giỏ hàng"
        type="success"
        customIcon={<CheckCircle2 size={36} color={COLORS.primaryContainer} />}
        iconBgClassName="bg-catalog-muted"
        dismissible
        onClose={closeCartFeedback}
        primaryButtonText="Xem giỏ hàng"
        onPrimaryPress={openCart}
        secondaryButtonText="Đóng"
        onSecondaryPress={closeCartFeedback}
      >
        <View accessibilityLiveRegion="polite" className="w-full gap-sm">
          <Text numberOfLines={3} className="text-center font-sans text-body-md font-semibold text-on-surface">
            {cartFeedback?.name}{cartFeedback?.color ? ` · ${cartFeedback.color}` : ''}
          </Text>
          <Text className="text-center font-sans text-body-sm leading-relaxed text-catalog-muted-text">
            Sản phẩm đã được thêm vào giỏ hàng trên thiết bị này.
          </Text>
        </View>
      </FeedbackModal>
      <FeedbackModal
        visible={reviewNotice !== null}
        title="Chưa thể đánh giá"
        message={reviewNotice ?? undefined}
        type="warning"
        dismissible
        onClose={() => setReviewNotice(null)}
        primaryButtonText="Đóng"
        onPrimaryPress={() => setReviewNotice(null)}
      />
    </View>
  );
}
