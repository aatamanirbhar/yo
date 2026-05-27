import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeCouponDiscount,
  type CouponDetails,
} from "@/lib/coupon-math";

export type CouponType = "percent" | "flat";

export type Coupon = CouponDetails & {
  id: string;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
};

export type CouponValidation =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

export async function validateCouponForSubtotal(
  rawCode: string,
  subtotal: number,
): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return { ok: false, error: "Lookup failed" };
  if (!data) return { ok: false, error: "Invalid coupon code" };

  const c = data as Coupon;

  if (c.expires_at && new Date(c.expires_at) < new Date()) {
    return { ok: false, error: "Coupon has expired" };
  }
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) {
    return { ok: false, error: "Coupon usage limit reached" };
  }
  if (subtotal < Number(c.min_subtotal)) {
    return {
      ok: false,
      error: `Minimum order ₹${Number(c.min_subtotal)} required`,
    };
  }

  const discount = computeCouponDiscount(c, subtotal);
  return { ok: true, coupon: c, discount };
}

export { computeCouponDiscount };
