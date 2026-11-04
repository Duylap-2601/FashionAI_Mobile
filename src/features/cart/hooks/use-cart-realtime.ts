import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { getMainSocket } from '@/realtime/socket';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { CART_MUTATION_KEY, cartKeys } from './use-cart';

/**
 * BE phát `cart:updated` khi giỏ đổi ở thiết bị khác hoặc sau thanh toán (đã bỏ các món
 * vừa mua). Tải lại giỏ, trừ khi máy này còn thay đổi đang gửi: onSettled của mutation đó
 * sẽ tải lại, còn tải ngay thì đè mất thay đổi tạm đang hiện.
 */
export function useCartRealtime() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;
    let socket: Socket | null = null;

    const handleCartUpdated = () => {
      if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) > 0) return;
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    };

    getMainSocket()
      .then((s) => {
        if (!active) return;
        socket = s;
        s.on('cart:updated', handleCartUpdated);
      })
      .catch(() => {});

    return () => {
      active = false;
      socket?.off('cart:updated', handleCartUpdated);
    };
  }, [isAuthenticated, queryClient]);
}
