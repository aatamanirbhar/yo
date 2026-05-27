"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CouponDetails } from "@/lib/coupon-math";

type CouponState = {
  applied: CouponDetails | null;
  apply: (c: CouponDetails) => void;
  remove: () => void;
};

export const useCoupon = create<CouponState>()(
  persist(
    (set) => ({
      applied: null,
      apply: (c) => set({ applied: c }),
      remove: () => set({ applied: null }),
    }),
    { name: "radharani-coupon" },
  ),
);
