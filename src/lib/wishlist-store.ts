"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  addedAt: number;
};

type WishState = {
  items: WishItem[];
  has: (productId: string) => boolean;
  toggle: (item: Omit<WishItem, "addedAt">) => boolean; // returns final isSaved
  remove: (productId: string) => void;
  clear: () => void;
};

export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (id) => get().items.some((i) => i.productId === id),
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          set({ items: get().items.filter((i) => i.productId !== item.productId) });
          return false;
        }
        set({ items: [...get().items, { ...item, addedAt: Date.now() }] });
        return true;
      },
      remove: (id) =>
        set({ items: get().items.filter((i) => i.productId !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: "radharani-wishlist" },
  ),
);
