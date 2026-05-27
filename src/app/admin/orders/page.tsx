import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, customer_name, customer_email, total, status, payment_status, coupon_code, discount_amount, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Orders</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 font-medium">Order #</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Coupon</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono">
                  <Link href={`/admin/orders/${o.id}`} className="text-brand-600 hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="p-3">
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-gray-500">{o.customer_email}</p>
                </td>
                <td className="p-3 font-semibold">{formatINR(Number(o.total))}</td>
                <td className="p-3">
                  {o.coupon_code ? (
                    <div className="text-xs">
                      <span className="font-mono bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">
                        {o.coupon_code}
                      </span>
                      <p className="text-green-700 mt-0.5">
                        −{formatINR(Number(o.discount_amount ?? 0))}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {o.payment_status}
                  </span>
                </td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
