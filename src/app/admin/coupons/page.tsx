import { createAdminClient } from "@/lib/supabase/admin";
import { createCoupon, deleteCoupon, toggleCoupon } from "../_actions";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Coupons</h1>

      <form action={createCoupon} className="card p-4 mb-6 space-y-3">
        <h2 className="font-semibold text-sm">New coupon</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Code</label>
            <input
              name="code"
              required
              className="input font-mono uppercase"
              placeholder="WELCOME10"
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="percent">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label className="label">Value</label>
            <input
              name="value"
              type="number"
              min="0"
              step="0.01"
              required
              className="input"
              placeholder="10"
            />
          </div>
          <div>
            <label className="label">Min order (₹)</label>
            <input
              name="min_subtotal"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              className="input"
            />
          </div>
          <div>
            <label className="label">Max discount (₹, optional)</label>
            <input
              name="max_discount"
              type="number"
              min="0"
              step="1"
              className="input"
              placeholder="500"
            />
          </div>
          <div>
            <label className="label">Usage limit (optional)</label>
            <input
              name="usage_limit"
              type="number"
              min="1"
              className="input"
              placeholder="100"
            />
          </div>
          <div>
            <label className="label">Expires (optional)</label>
            <input name="expires_at" type="datetime-local" className="input" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm pb-2">
              <input name="is_active" type="checkbox" defaultChecked /> Active
            </label>
          </div>
        </div>
        <button className="btn-primary">Create coupon</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Value</th>
              <th className="p-3 font-medium">Min</th>
              <th className="p-3 font-medium">Max</th>
              <th className="p-3 font-medium">Used / Limit</th>
              <th className="p-3 font-medium">Expires</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(coupons ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">
                  {c.type === "percent"
                    ? `${Number(c.value)}%`
                    : formatINR(Number(c.value))}
                </td>
                <td className="p-3">{formatINR(Number(c.min_subtotal))}</td>
                <td className="p-3">
                  {c.max_discount ? formatINR(Number(c.max_discount)) : "—"}
                </td>
                <td className="p-3">
                  {c.used_count} / {c.usage_limit ?? "∞"}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {c.expires_at
                    ? new Date(c.expires_at).toLocaleDateString("en-IN")
                    : "—"}
                </td>
                <td className="p-3">
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="is_active" value={String(c.is_active)} />
                    <button
                      className={[
                        "text-xs px-2 py-1 rounded-full font-medium",
                        c.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600",
                      ].join(" ")}
                    >
                      {c.is_active ? "Active" : "Disabled"}
                    </button>
                  </form>
                </td>
                <td className="p-3 text-right">
                  <form action={deleteCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-red-600 hover:underline text-sm">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!coupons || coupons.length === 0) && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
