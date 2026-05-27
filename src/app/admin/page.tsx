import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = createAdminClient();

  const [
    { count: productCount },
    { count: categoryCount },
    { count: orderCount },
    { count: userCount },
    { data: revenueRows },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("categories").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("orders").select("total").eq("payment_status", "paid"),
    admin
      .from("orders")
      .select("id, order_number, customer_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const revenue = (revenueRows ?? []).reduce(
    (s, r) => s + Number(r.total ?? 0),
    0,
  );

  const stats = [
    { label: "Products", value: productCount ?? 0 },
    { label: "Categories", value: categoryCount ?? 0 },
    { label: "Orders", value: orderCount ?? 0 },
    { label: "Users", value: userCount ?? 0 },
    { label: "Revenue", value: formatINR(revenue) },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        {!recentOrders || recentOrders.length === 0 ? (
          <p className="p-6 text-center text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3 font-medium">Order #</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">
                    <Link href={`/admin/orders/${o.id}`} className="text-brand-600 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3 font-semibold">{formatINR(o.total)}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
