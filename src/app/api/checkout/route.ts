import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { generateOrderNumber } from "@/lib/utils";
import {
  haversineKm,
  isInStoreState,
  quoteShipping,
  STORE_LOCATION,
} from "@/lib/shipping";
import { validateCouponForSubtotal } from "@/lib/coupons";

export const runtime = "nodejs";

const ItemSchema = z.object({
  productId: z.string().uuid(),
  variationId: z.string().uuid().nullable(),
  quantity: z.number().int().positive(),
});

const BodySchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
  }),
  shipping: z.object({
    line1: z.string().min(1),
    line2: z.string().optional().default(""),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4),
  }),
  shippingLocation: z
    .object({
      lat: z.number().nullable(),
      lng: z.number().nullable(),
      formatted: z.string().nullable().optional(),
    })
    .optional(),
  coupon: z.string().nullable().optional(),
  items: z.array(ItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const admin = createAdminClient();

  // Pull authoritative product + variation data
  const productIds = [...new Set(body.items.map((i) => i.productId))];
  const variationIds = body.items
    .map((i) => i.variationId)
    .filter((v): v is string => !!v);

  const [{ data: products, error: pErr }, { data: variations, error: vErr }] =
    await Promise.all([
      admin
        .from("products")
        .select("id, name, slug, base_price, images, is_active")
        .in("id", productIds),
      variationIds.length
        ? admin
            .from("product_variations")
            .select("id, product_id, name, price, stock")
            .in("id", variationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (pErr || vErr) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  type PRow = NonNullable<typeof products>[number];
  type VRow = NonNullable<typeof variations>[number];
  const productMap = new Map<string, PRow>(
    (products ?? []).map((p) => [p.id, p]),
  );
  const variationMap = new Map<string, VRow>(
    (variations ?? []).map((v) => [v.id, v]),
  );

  // Build snapshot items + compute totals from DB
  let subtotal = 0;
  const snapshotItems: {
    product_id: string;
    variation_id: string | null;
    product_name: string;
    variation_name: string | null;
    image_url: string | null;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[] = [];

  for (const item of body.items) {
    const prod = productMap.get(item.productId);
    if (!prod || !prod.is_active) {
      return NextResponse.json(
        { error: `Product unavailable` },
        { status: 400 },
      );
    }
    let unit = Number(prod.base_price);
    let variationName: string | null = null;
    if (item.variationId) {
      const v = variationMap.get(item.variationId);
      if (!v || v.product_id !== prod.id) {
        return NextResponse.json(
          { error: "Variation mismatch" },
          { status: 400 },
        );
      }
      if (v.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${prod.name} - ${v.name}` },
          { status: 400 },
        );
      }
      unit = Number(v.price);
      variationName = v.name;
    }
    const lineSubtotal = unit * item.quantity;
    subtotal += lineSubtotal;
    snapshotItems.push({
      product_id: prod.id,
      variation_id: item.variationId,
      product_name: prod.name,
      variation_name: variationName,
      image_url: prod.images?.[0] ?? null,
      unit_price: unit,
      quantity: item.quantity,
      subtotal: lineSubtotal,
    });
  }

  // ---------- Coupon (server-side validation) ----------
  let discountAmount = 0;
  let couponCode: string | null = null;
  if (body.coupon) {
    const coupon = await validateCouponForSubtotal(body.coupon, subtotal);
    if (!coupon.ok) {
      return NextResponse.json({ error: coupon.error }, { status: 400 });
    }
    discountAmount = coupon.discount;
    couponCode = coupon.coupon.code;
  }
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // ---------- Shipping (server-side recompute) ----------
  const inState = isInStoreState(body.shipping.state);
  const shipLat = body.shippingLocation?.lat ?? null;
  const shipLng = body.shippingLocation?.lng ?? null;
  const distanceKm =
    shipLat !== null && shipLng !== null
      ? haversineKm(STORE_LOCATION, { lat: shipLat, lng: shipLng })
      : null;
  const shippingQuote = quoteShipping({
    subtotal: subtotalAfterDiscount,
    distanceKm,
    inStoreState: inState,
  });
  const shippingFee = shippingQuote.fee;

  const total = subtotalAfterDiscount + shippingFee;
  if (total <= 0) {
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });
  }

  // Get user (may be null = guest)
  const serverSb = createClient();
  const {
    data: { user },
  } = await serverSb.auth.getUser();

  const orderNumber = generateOrderNumber();

  // Create Razorpay order
  let razorOrder;
  try {
    razorOrder = await createRazorpayOrder({
      amountInPaise: Math.round(total * 100),
      receipt: orderNumber,
      notes: {
        order_number: orderNumber,
        customer_email: body.customer.email,
      },
    });
  } catch (e: unknown) {
    console.error("Razorpay order create failed:", e);
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 502 },
    );
  }

  // Insert order row
  const { data: orderRow, error: oErr } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user?.id ?? null,
      customer_name: body.customer.name,
      customer_email: body.customer.email,
      customer_phone: body.customer.phone,
      shipping_address: body.shipping,
      shipping_lat: shipLat,
      shipping_lng: shipLng,
      shipping_distance_km: distanceKm ? Number(distanceKm.toFixed(2)) : null,
      shipping_zone: shippingQuote.zone,
      subtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      coupon_code: couponCode,
      total,
      status: "pending",
      payment_status: "pending",
      razorpay_order_id: razorOrder.id,
    })
    .select()
    .single();

  if (oErr || !orderRow) {
    console.error("Order insert failed:", oErr);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  const { error: iErr } = await admin
    .from("order_items")
    .insert(snapshotItems.map((s) => ({ ...s, order_id: orderRow.id })));

  if (iErr) {
    console.error("Order items insert failed:", iErr);
    return NextResponse.json({ error: "Could not save items" }, { status: 500 });
  }

  return NextResponse.json({
    orderId: orderRow.id,
    orderNumber,
    razorpayOrderId: razorOrder.id,
    amount: Math.round(total * 100),
    currency: "INR",
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
