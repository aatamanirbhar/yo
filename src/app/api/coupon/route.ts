import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponForSubtotal } from "@/lib/coupons";

export const runtime = "nodejs";

const Body = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const result = await validateCouponForSubtotal(
    parsed.data.code,
    parsed.data.subtotal,
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    code: result.coupon.code,
    type: result.coupon.type,
    value: Number(result.coupon.value),
    min_subtotal: Number(result.coupon.min_subtotal),
    max_discount:
      result.coupon.max_discount !== null
        ? Number(result.coupon.max_discount)
        : null,
    discount: result.discount,
  });
}
