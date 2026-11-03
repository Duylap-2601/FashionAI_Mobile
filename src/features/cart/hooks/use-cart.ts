import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { HttpOptions } from '@/api/http';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import type { IOrderItem } from '@/features/orders/types/order';
import {
  cartApi,
  isUuidV4,
  type CartLineInput,
  type ServerCart,
  type ServerCartItem,
} from '../api/cart.api';

export interface ICartLine extends IOrderItem {
  available?: boolean;
}

export type AddCartItemInput = Omit<IOrderItem, 'total'> & { total?: number };

interface AddItemVariables {
  line: CartLineInput;
  display: AddCartItemInput;
}

interface LineQuantityVariables {
  lineId: string;
  quantity: number;
}

interface LineIdVariables {
  lineId: string;
}

export const cartKeys = {
  all: ['cart'] as const,
  user: (userId: string | null | undefined) => ['cart', userId ?? null] as const,
};

const EMPTY_ITEMS: ICartLine[] = [];

function subscribeToHydration(notify: () => void) {
  const unsubscribeStart = useCartStore.persist.onHydrate(notify);
  const unsubscribeFinish = useCartStore.persist.onFinishHydration(notify);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}

export function useGuestCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    useCartStore.persist.hasHydrated,
    () => false,
  );
}

function getLinePrice(item: ServerCartItem): number {
  return item.product.sale?.salePrice ?? item.product.price;
}

export function mapServerCartItem(item: ServerCartItem): ICartLine {
  const price = getLinePrice(item);
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    price,
    quantity: item.quantity,
    total: price * item.quantity,
    color: item.color ?? undefined,
    imageUrl: item.product.imageUrl || undefined,
    available: item.available,
  };
}

export function mapServerCart(cart: ServerCart): ICartLine[] {
  return cart.items.map(mapServerCartItem);
}

export async function fetchCartLines(opts?: HttpOptions): Promise<ICartLine[]> {
  const cart = await cartApi.getCart(opts);
  return mapServerCart(cart);
}

function invalidateCart(queryClient: QueryClient, userId: string | null): void {
  void queryClient.invalidateQueries({ queryKey: cartKeys.all });
  void queryClient.invalidateQueries({ queryKey: cartKeys.user(userId) });
}

function applyAdd(current: ICartLine[], display: AddCartItemInput): ICartLine[] {
  const productId = String(display.productId);
  const existingIndex = current.findIndex(
    (item) => String(item.productId) === productId && item.color === display.color,
  );

  if (existingIndex > -1) {
    const existing = current[existingIndex];
    const quantity = existing.quantity + display.quantity;
    const next = [...current];
    next[existingIndex] = { ...existing, quantity, total: existing.price * quantity };
    return next;
  }

  return [
    ...current,
    {
      productId: display.productId,
      productName: display.productName,
      price: display.price,
      quantity: display.quantity,
      total: display.total ?? display.price * display.quantity,
      color: display.color,
      imageUrl: display.imageUrl,
      available: true,
    },
  ];
}

function applyQuantity(current: ICartLine[], lineId: string, quantity: number): ICartLine[] {
  if (quantity <= 0) {
    return current.filter((item) => String(item.id) !== lineId);
  }
  return current.map((item) =>
    String(item.id) === lineId
      ? { ...item, quantity, total: item.price * quantity }
      : item,
  );
}

function applyRemove(current: ICartLine[], lineId: string): ICartLine[] {
  return current.filter((item) => String(item.id) !== lineId);
}

function resolveLine(
  items: ICartLine[],
  productId: string | number,
  variantId?: string | number,
): ICartLine | undefined {
  const productKey = String(productId);
  const sameProduct = items.filter((item) => String(item.productId) === productKey);
  if (variantId !== undefined) {
    const exact = sameProduct.find(
      (item) =>
        String(item.id) === String(variantId) ||
        String(item.variantId) === String(variantId) ||
        item.color === variantId,
    );
    if (exact) return exact;
  }
  return sameProduct[0];
}

export function useServerCart() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: cartKeys.user(userId),
    queryFn: ({ signal }) => fetchCartLines({ signal }),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  return { ...query, userId, isAuthenticated };
}

export function useCart() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const guestItems = useCartStore((state) => state.items);
  const guestAddItem = useCartStore((state) => state.addItem);
  const guestRemoveItem = useCartStore((state) => state.removeItem);
  const guestUpdateQuantity = useCartStore((state) => state.updateQuantity);
  const guestClearCart = useCartStore((state) => state.clearCart);

  const cartQuery = useQuery({
    queryKey: cartKeys.user(userId),
    queryFn: ({ signal }) => fetchCartLines({ signal }),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const serverItems = cartQuery.data;

  const items = useMemo<ICartLine[]>(
    () => (isAuthenticated ? serverItems ?? EMPTY_ITEMS : guestItems),
    [guestItems, isAuthenticated, serverItems],
  );

  const addMutation = useMutation({
    mutationFn: ({ line }: AddItemVariables) => cartApi.addItem(line),
    onMutate: async ({ display }) => {
      const queryKey = cartKeys.user(userId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ICartLine[]>(queryKey);
      queryClient.setQueryData<ICartLine[]>(queryKey, (current) =>
        applyAdd(current ?? [], display),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.user(userId), context.previous);
      }
    },
    onSettled: () => invalidateCart(queryClient, userId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ lineId, quantity }: LineQuantityVariables) =>
      cartApi.updateItem(lineId, quantity),
    onMutate: async ({ lineId, quantity }) => {
      const queryKey = cartKeys.user(userId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ICartLine[]>(queryKey);
      queryClient.setQueryData<ICartLine[]>(queryKey, (current) =>
        applyQuantity(current ?? [], lineId, quantity),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.user(userId), context.previous);
      }
    },
    onSettled: () => invalidateCart(queryClient, userId),
  });

  const removeMutation = useMutation({
    mutationFn: ({ lineId }: LineIdVariables) => cartApi.removeItem(lineId),
    onMutate: async ({ lineId }) => {
      const queryKey = cartKeys.user(userId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ICartLine[]>(queryKey);
      queryClient.setQueryData<ICartLine[]>(queryKey, (current) =>
        applyRemove(current ?? [], lineId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.user(userId), context.previous);
      }
    },
    onSettled: () => invalidateCart(queryClient, userId),
  });

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onMutate: async () => {
      const queryKey = cartKeys.user(userId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ICartLine[]>(queryKey);
      queryClient.setQueryData<ICartLine[]>(queryKey, []);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.user(userId), context.previous);
      }
    },
    onSettled: () => invalidateCart(queryClient, userId),
  });

  const { mutate: mutateAdd } = addMutation;
  const { mutate: mutateUpdate } = updateMutation;
  const { mutate: mutateRemove } = removeMutation;
  const { mutate: mutateClear } = clearMutation;

  const addItem = useCallback(
    (item: AddCartItemInput) => {
      if (!isAuthenticated) {
        guestAddItem(item);
        return;
      }

      const productId = String(item.productId);
      if (!isUuidV4(productId)) {
        console.warn(`Bỏ qua sản phẩm không có mã UUID hợp lệ: ${productId}`);
        return;
      }

      const line: CartLineInput = { productId, quantity: item.quantity };
      if (item.color) {
        line.color = item.color;
      }
      mutateAdd({ line, display: item });
    },
    [guestAddItem, isAuthenticated, mutateAdd],
  );

  const updateQuantity = useCallback(
    (productId: string | number, quantity: number, variantId?: string | number) => {
      if (!isAuthenticated) {
        guestUpdateQuantity(productId, quantity, variantId);
        return;
      }

      const line = resolveLine(items, productId, variantId);
      if (!line || line.id === undefined) return;

      if (quantity <= 0) {
        mutateRemove({ lineId: String(line.id) });
        return;
      }
      mutateUpdate({ lineId: String(line.id), quantity });
    },
    [guestUpdateQuantity, isAuthenticated, items, mutateRemove, mutateUpdate],
  );

  const removeItem = useCallback(
    (productId: string | number, variantId?: string | number) => {
      if (!isAuthenticated) {
        guestRemoveItem(productId, variantId);
        return;
      }

      const line = resolveLine(items, productId, variantId);
      if (!line || line.id === undefined) return;
      mutateRemove({ lineId: String(line.id) });
    },
    [guestRemoveItem, isAuthenticated, items, mutateRemove],
  );

  const clearCart = useCallback(() => {
    if (!isAuthenticated) {
      guestClearCart();
      return;
    }
    mutateClear();
  }, [guestClearCart, isAuthenticated, mutateClear]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    await queryClient.invalidateQueries({ queryKey: cartKeys.all });
  }, [isAuthenticated, queryClient]);

  const getTotalItems = useCallback(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const getTotalPrice = useCallback(
    () =>
      items.reduce(
        (sum, item) =>
          item.available === false ? sum : sum + item.price * item.quantity,
        0,
      ),
    [items],
  );

  return {
    items,
    isAuthenticated,
    isLoading: isAuthenticated ? cartQuery.isPending : false,
    isError: isAuthenticated ? cartQuery.isError : false,
    isFetching: cartQuery.isFetching,
    refetch: cartQuery.refetch,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    getTotalItems,
    getTotalPrice,
  };
}
