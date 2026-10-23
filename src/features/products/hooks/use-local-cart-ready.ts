import { useSyncExternalStore } from "react";
import { useCartStore } from "@/features/cart/store/use-cart-store";

function subscribeToHydration(notify: () => void) {
  const unsubscribeStart = useCartStore.persist.onHydrate(notify);
  const unsubscribeFinish = useCartStore.persist.onFinishHydration(notify);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}

/** Prevent actions/counts from racing the existing AsyncStorage hydration. */
export function useLocalCartReady() {
  return useSyncExternalStore(
    subscribeToHydration,
    useCartStore.persist.hasHydrated,
    () => false,
  );
}
