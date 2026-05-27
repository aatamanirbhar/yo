import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Order history</h1>
        <Link href="/account" className="text-sm text-brand-600 hover:underline">← Account</Link>
      </div>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div>
                <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                <p className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleString("en-IN")}
                </p>
                {o.coupon_code && Number(o.discount_amount ?? 0) > 0 && (
                  <p className="text-xs text-green-700 mt-1">
                    <span className="font-mono bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                      {o.coupon_code}
                    </span>{" "}
                    saved {formatINR(Number(o.discount_amount))}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={[
                    "text-xs px-2 py-1 rounded-full font-medium",
                    o.status === "paid" || o.status === "shipped" || o.status === "delivered"
                      ? "bg-green-100 text-green-700"
                      : o.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700",
                  ].join(" ")}
                >
                  {o.status}
                </span>
                <span className="font-semibold">{formatINR(o.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
