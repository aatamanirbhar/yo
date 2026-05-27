"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variationId: string | null;
  productSlug: string;
  name: string;
  variationName: string | null;
  price: number;
  image: string | null;
  quantity: number;
  maxStock?: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: CartItem) => void;
  remove: (productId: string, variationId: string | null) => void;
  setQty: (
    productId: string,
    variationId: string | null,
    quantity: number,
  ) => void;
  clear: () => void;
  replaceAll: (items: CartItem[]) => void;
  subtotal: () => number;
  count: () => number;
};

const sameLine = (
  a: { productId: string; variationId: string | null },
  b: { productId: string; variationId: string | null },
) => a.productId === b.productId && a.variationId === b.variationId;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      add: (item) =>
        set((s) => {
          const existing = s.items.find((x) => sameLine(x, item));
          if (existing) {
            const max = existing.maxStock ?? Infinity;
            return {
              items: s.items.map((x) =>
                sameLine(x, item)
                  ? { ...x, quantity: Math.min(x.quantity + item.quantity, max) }
                  : x,
              ),
              isOpen: true,
            };
          }
          return { items: [...s.items, item], isOpen: true };
        }),
      remove: (productId, variationId) =>
        set((s) => ({
          items: s.items.filter(
            (x) => !sameLine(x, { productId, variationId }),
          ),
        })),
      setQty: (productId, variationId, quantity) =>
        set((s) => ({
          items: s.items
            .map((x) =>
              sameLine(x, { productId, variationId })
                ? {
                    ...x,
                    quantity: Math.max(
                      0,
                      Math.min(quantity, x.maxStock ?? Infinity),
                    ),
                  }
                : x,
            )
            .filter((x) => x.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      replaceAll: (items) => set({ items }),
      subtotal: () =>
        get().items.reduce((s, x) => s + x.price * x.quantity, 0),
      count: () => get().items.reduce((n, x) => n + x.quantity, 0),
    }),
    { name: "radharani-cart" },
  ),
);
