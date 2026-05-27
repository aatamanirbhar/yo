/**
 * Pure coupon math — safe to import from both client and server.
 * Server validation (DB lookup, expiry, usage limit) lives in `coupons.ts`.
 */

export type CouponDetails = {
  code: string;
  type: "percent" | "flat";
  value: number;
  min_subtotal: number;
  max_discount: number | null;
};

export function isCouponMinMet(c: CouponDetails, subtotal: number): boolean {
  return subtotal >= Number(c.min_subtotal);
}

export function computeCouponDiscount(
  c: CouponDetails,
  subtotal: number,
): number {
  if (!isCouponMinMet(c, subtotal)) return 0;
  const value = Number(c.value);
  let amount = c.type === "percent" ? (subtotal * value) / 100 : value;
  if (c.max_discount !== null && c.max_discount !== undefined) {
    amount = Math.min(amount, Number(c.max_discount));
  }
  amount = Math.min(amount, subtotal);
  return Math.round(amount);
}
