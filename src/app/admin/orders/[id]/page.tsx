import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";
import { updateOrderStatus } from "../../_actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!order) notFound();

  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">← Orders</Link>
        <h1 className="text-2xl md:text-3xl font-display font-bold mt-1 font-mono">{order.order_number}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold">{formatINR(Number(order.total))}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Payment</p>
          <p className="text-lg font-semibold">{order.payment_status}</p>
          {order.razorpay_payment_id && (
            <p className="text-xs text-gray-500 font-mono mt-1">{order.razorpay_payment_id}</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Status</p>
          <form action={updateOrderStatus} className="flex gap-2 mt-1">
            <input type="hidden" name="id" value={order.id} />
            <select name="status" defaultValue={order.status} className="input py-1.5">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary py-1.5 px-3 text-sm">Update</button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Customer</h2>
          <p className="text-sm">{order.customer_name}</p>
          <p className="text-sm text-gray-500">{order.customer_email}</p>
          <p className="text-sm text-gray-500">{order.customer_phone}</p>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Shipping address</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {order.shipping_address.line1}
            {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}<br />
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="font-semibold p-4 border-b">Items</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Unit</th>
              <th className="p-3 font-medium">Qty</th>
              <th className="p-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td className="p-3">
                  {it.product_name}
                  {it.variation_name && <span className="text-gray-500"> — {it.variation_name}</span>}
                </td>
                <td className="p-3">{formatINR(Number(it.unit_price))}</td>
                <td className="p-3">{it.quantity}</td>
                <td className="p-3 text-right font-semibold">{formatINR(Number(it.subtotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="p-3 text-right text-gray-500">Subtotal</td>
              <td className="p-3 text-right">{formatINR(Number(order.subtotal))}</td>
            </tr>
            {Number(order.discount_amount ?? 0) > 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-right text-green-700">
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </td>
                <td className="p-3 text-right text-green-700">
                  −{formatINR(Number(order.discount_amount))}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="p-3 text-right text-gray-500">Shipping</td>
              <td className="p-3 text-right">{Number(order.shipping_fee) > 0 ? formatINR(Number(order.shipping_fee)) : "Free"}</td>
            </tr>
            <tr className="border-t">
              <td colSpan={3} className="p-3 text-right font-semibold">Total</td>
              <td className="p-3 text-right font-bold">{formatINR(Number(order.total))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
