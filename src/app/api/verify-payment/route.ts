import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { notifyAdminNewOrder } from "@/lib/telegram";

export const runtime = "nodejs";

const BodySchema = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const admin = createAdminClient();

  // Fetch the order
  const { data: order, error: oErr } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.razorpay_order_id !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const valid = verifyRazorpaySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    await admin
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Mark paid
  const { error: uErr } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "paid",
      razorpay_payment_id,
      razorpay_signature,
    })
    .eq("id", orderId);

  if (uErr) {
    console.error("Order update failed:", uErr);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Decrement variation stock (best-effort)
  const { data: items } = await admin
    .from("order_items")
    .select("variation_id, quantity")
    .eq("order_id", orderId);

  if (items) {
    for (const it of items) {
      if (it.variation_id) {
        // Single-row decrement via RPC-less approach
        const { data: v } = await admin
          .from("product_variations")
          .select("stock")
          .eq("id", it.variation_id)
          .single();
        if (v) {
          await admin
            .from("product_variations")
            .update({ stock: Math.max(0, v.stock - it.quantity) })
            .eq("id", it.variation_id);
        }
      }
    }
  }

  // Bump coupon usage if one was applied
  if (order.coupon_code) {
    const { data: c } = await admin
      .from("coupons")
      .select("used_count")
      .eq("code", order.coupon_code)
      .single();
    if (c) {
      await admin
        .from("coupons")
        .update({ used_count: (c.used_count ?? 0) + 1 })
        .eq("code", order.coupon_code);
    }
  }

  // Fire notifications (don't fail the order if they error)
  const { data: fullItems } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  Promise.allSettled([
    sendOrderConfirmationEmail({ order, items: fullItems ?? [] }),
    notifyAdminNewOrder({ order, items: fullItems ?? [] }),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Notification ${i} failed:`, r.reason);
      }
    });
  });

  return NextResponse.json({
    success: true,
    orderNumber: order.order_number,
  });
}
