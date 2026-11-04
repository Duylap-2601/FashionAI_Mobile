import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCartStore } from '@/features/cart/store/use-cart-store';
import { cartApi, isUuidV4, type CartLineInput } from '../api/cart.api';
import { cartKeys, useGuestCartHydrated } from '../hooks/use-cart';
import { useCartRealtime } from '../hooks/use-cart-realtime';

export function CartSync(): null {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const hydrated = useGuestCartHydrated();
  const guestItems = useCartStore((state) => state.items);
  const mergedForRef = useRef<string | null>(null);
  useCartRealtime();

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      mergedForRef.current = null;
      return;
    }
    if (!hydrated || mergedForRef.current === userId) return;

    if (guestItems.length === 0) {
      mergedForRef.current = userId;
      return;
    }

    const lines: CartLineInput[] = guestItems
      .filter((item) => isUuidV4(String(item.productId)))
      .map((item) => {
        const line: CartLineInput = {
          productId: String(item.productId),
          quantity: item.quantity,
        };
        if (item.color) {
          line.color = item.color;
        }
        return line;
      });

    mergedForRef.current = userId;

    if (lines.length === 0) {
      useCartStore.getState().clearCart();
      return;
    }

    void (async () => {
      try {
        await cartApi.mergeCart(lines);
        useCartStore.getState().clearCart();
      } catch {
        mergedForRef.current = null;
      } finally {
        await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      }
    })();
  }, [guestItems, hydrated, isAuthenticated, queryClient, userId]);

  return null;
}

export default CartSync;
