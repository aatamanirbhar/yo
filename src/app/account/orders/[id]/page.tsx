import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { CheckCircle2, Clock, Truck, Home, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const STEP_LABELS: Record<string, { label: string; Icon: typeof Clock }> = {
  pending: { label: "Placed", Icon: Clock },
  paid: { label: "Confirmed", Icon: CheckCircle2 },
  shipped: { label: "Shipped", Icon: Truck },
  delivered: { label: "Delivered", Icon: Home },
};

const STEP_ORDER: Array<keyof typeof STEP_LABELS> = [
  "pending",
  "paid",
  "shipped",
  "delivered",
];

export default async function MyOrderDetail({
  params,
}: {
  params: { id: string };
}) {
  const sb = createClient();

  // RLS ensures customers only see their own orders.
  const { data: order } = await sb
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  const { data: items } = await sb
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const currentIdx = STEP_ORDER.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/account/orders"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Order history
        </Link>
        <span className="text-xs text-gray-500">
          Placed {new Date(order.created_at).toLocaleString("en-IN")}
        </span>
      </div>

      <h1 className="font-mono text-2xl md:text-3xl font-bold mb-1">
        {order.order_number}
      </h1>
      <p className="text-gray-600 mb-6">
        Hi {order.customer_name}, here&apos;s the full breakdown of your order.
      </p>

      <div className="card p-5 mb-6">
        {cancelled ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm flex items-center gap-2">
            <XCircle size={18} /> This order was cancelled.
          </div>
        ) : (
          <ol className="flex items-center justify-between">
            {STEP_ORDER.map((key, i) => {
              const Step = STEP_LABELS[key];
              const done = i <= currentIdx;
              return (
                <li
                  key={key}
                  className="flex-1 flex flex-col items-center text-center"
                >
                  <div
                    className={[
                      "h-9 w-9 rounded-full flex items-center justify-center",
                      done
                        ? "bg-brand-600 text-white"
                        : "bg-gray-200 text-gray-400",
                    ].join(" ")}
                  >
                    <Step.Icon size={18} />
                  </div>
                  <p
                    className={`text-xs mt-1.5 ${
                      done ? "font-semibold" : "text-gray-400"
                    }`}
                  >
                    {Step.label}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="card overflow-hidden mb-6">
        <h2 className="font-semibold p-4 border-b">Items</h2>
        <ul className="divide-y">
          {(items ?? []).map((it) => (
            <li key={it.id} className="p-4 flex gap-3 text-sm">
              <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {it.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.image_url}
                    alt={it.product_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{it.product_name}</p>
                {it.variation_name && (
                  <p className="text-xs text-gray-500">{it.variation_name}</p>
                )}
                <p className="text-xs text-gray-500">
                  Qty {it.quantity} × {formatINR(it.unit_price)}
                </p>
              </div>
              <p className="font-semibold whitespace-nowrap">
                {formatINR(it.subtotal)}
              </p>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {Number(order.discount_amount ?? 0) > 0 && (
            <div className="flex justify-between text-green-700">
              <span>
                Discount
                {order.coupon_code ? ` (${order.coupon_code})` : ""}
              </span>
              <span>−{formatINR(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span>
              {Number(order.shipping_fee) > 0
                ? formatINR(order.shipping_fee)
                : "Free"}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t mt-2 text-base">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-2">Shipping address</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {order.customer_name}
            <br />
            {order.shipping_address.line1}
            {order.shipping_address.line2 &&
              `, ${order.shipping_address.line2}`}
            <br />
            {order.shipping_address.city}, {order.shipping_address.state}{" "}
            {order.shipping_address.pincode}
            <br />
            Phone: {order.customer_phone}
          </p>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-2">Payment</h3>
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span
              className={
                order.payment_status === "paid"
                  ? "text-green-700 font-medium"
                  : "text-amber-700 font-medium"
              }
            >
              {order.payment_status}
            </span>
          </p>
          {order.razorpay_payment_id && (
            <p className="text-xs text-gray-500 font-mono mt-1 break-all">
              {order.razorpay_payment_id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
