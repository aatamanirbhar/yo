import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Body = z.object({
  orderNumber: z.string().min(3),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { orderNumber, email } = parsed.data;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber.trim())
    .ilike("customer_email", email.trim())
    .single();

  if (!order) {
    return NextResponse.json(
      { error: "No order found with that number + email" },
      { status: 404 },
    );
  }

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, variation_name, quantity, unit_price, subtotal")
    .eq("order_id", order.id);

  // Return only a sanitised view (no Razorpay IDs, signature, etc.)
  return NextResponse.json({
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    customer_name: order.customer_name,
    shipping_address: order.shipping_address,
    subtotal: Number(order.subtotal),
    shipping_fee: Number(order.shipping_fee),
    discount_amount: Number(order.discount_amount ?? 0),
    total: Number(order.total),
    created_at: order.created_at,
    items: items ?? [],
  });
}
