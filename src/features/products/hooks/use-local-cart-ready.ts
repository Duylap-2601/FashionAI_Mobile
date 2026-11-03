import { useAuth } from "@/features/auth/hooks/use-auth";
import { useGuestCartHydrated, useServerCart } from "@/features/cart/hooks/use-cart";

/** Prevent actions/counts from racing the existing AsyncStorage hydration. */
export function useLocalCartReady() {
  const { isAuthenticated } = useAuth();
  const guestReady = useGuestCartHydrated();
  const serverCart = useServerCart();

  if (!isAuthenticated) return guestReady;
  return serverCart.isFetched;
}
