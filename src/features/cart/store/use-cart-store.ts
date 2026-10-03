import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IOrderItem } from '@/features/orders/types/order';

interface CartState {
  items: IOrderItem[];
  addItem: (item: Omit<IOrderItem, 'total'> & { total?: number }) => void;
  removeItem: (productId: string | number, variantId?: string | number) => void;
  updateQuantity: (
    productId: string | number,
    quantity: number,
    variantId?: string | number,
  ) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variantId === newItem.variantId &&
          item.size === newItem.size &&
          item.color === newItem.color,
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        const current = updated[existingIndex];
        const newQty = current.quantity + newItem.quantity;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          total: newQty * current.price,
        };
        return { items: updated };
      }

      const total = newItem.total ?? newItem.price * newItem.quantity;
      return {
        items: [...state.items, { ...newItem, total }],
      };
    });
  },

  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.productId === productId && (variantId === undefined || item.variantId === variantId)),
      ),
    }));
  },

  updateQuantity: (productId, quantity, variantId) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) => {
        if (item.productId === productId && (variantId === undefined || item.variantId === variantId)) {
          return {
            ...item,
            quantity,
            total: quantity * item.price,
          };
        }
        return item;
      }),
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotalItems: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((acc, item) => acc + item.total, 0);
  },
    }),
    {
      name: 'fashionai-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useCartStore;
