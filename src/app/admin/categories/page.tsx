import { createAdminClient } from "@/lib/supabase/admin";
import { createCategory, deleteCategory } from "../_actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const admin = createAdminClient();
  const { data: categories } = await admin
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Categories</h1>

      <form action={createCategory} className="card p-4 mb-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="label">Name</label>
          <input name="name" required className="input" placeholder="e.g. Bags" />
        </div>
        <div>
          <label className="label">Image URL (optional)</label>
          <input name="image_url" type="url" className="input" placeholder="https://..." />
        </div>
        <button className="btn-primary">Add category</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Image</th>
              <th className="p-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(categories ?? []).map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500 font-mono text-xs">{c.slug}</td>
                <td className="p-3">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded object-cover" />
                  ) : "—"}
                </td>
                <td className="p-3 text-right">
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-red-600 hover:underline text-sm">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
