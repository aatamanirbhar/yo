import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", params.orderNumber)
    .single();

  if (!order) notFound();

  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <CheckCircle2 className="mx-auto text-green-500 mb-3" size={56} />
        <h1 className="text-3xl font-display font-bold mb-1">Order placed!</h1>
        <p className="text-gray-600">
          Thank you, {order.customer_name}. We&apos;ve sent a confirmation to{" "}
          <span className="font-medium">{order.customer_email}</span>.
        </p>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex justify-between mb-3 pb-3 border-b">
          <div>
            <p className="text-xs text-gray-500">Order number</p>
            <p className="font-mono font-semibold">{order.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-semibold text-lg">{formatINR(order.total)}</p>
          </div>
        </div>

        <h2 className="font-semibold mb-2">Items</h2>
        <ul className="divide-y divide-gray-100">
          {(items ?? []).map((it) => (
            <li key={it.id} className="py-2 flex justify-between text-sm">
              <span>
                {it.product_name}
                {it.variation_name && (
                  <span className="text-gray-500"> — {it.variation_name}</span>
                )}
                <span className="text-gray-500"> × {it.quantity}</span>
              </span>
              <span className="font-medium">{formatINR(it.subtotal)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>−{formatINR(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span>{Number(order.shipping_fee) > 0 ? formatINR(order.shipping_fee) : "Free"}</span>
          </div>
          <div className="flex justify-between font-semibold pt-1 border-t mt-1">
            <span>Total</span><span>{formatINR(order.total)}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t text-sm">
          <p className="font-semibold mb-1">Shipping to</p>
          <p className="text-gray-600">
            {order.shipping_address.line1}
            {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}<br />
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
