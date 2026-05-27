import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  // Auth users (paginated; first page = 50 by default)
  const { data: authData } = await admin.auth.admin.listUsers();
  const users = authData?.users ?? [];

  // Profiles to read is_admin flags
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, phone, is_admin");
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  // Per-user order summary (count + total)
  const ids = users.map((u) => u.id);
  const { data: orderRows } = await admin
    .from("orders")
    .select("user_id, total")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const stats = new Map<string, { count: number; total: number }>();
  (orderRows ?? []).forEach((r) => {
    if (!r.user_id) return;
    const prev = stats.get(r.user_id) ?? { count: 0, total: 0 };
    stats.set(r.user_id, { count: prev.count + 1, total: prev.total + Number(r.total) });
  });

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Users</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Orders</th>
              <th className="p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const p = profileMap.get(u.id);
              const s = stats.get(u.id);
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{p?.full_name || "—"}</td>
                  <td className="p-3 text-gray-600">{p?.phone || "—"}</td>
                  <td className="p-3">
                    {p?.is_admin ? (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">admin</span>
                    ) : "customer"}
                  </td>
                  <td className="p-3">{s?.count ?? 0}</td>
                  <td className="p-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
