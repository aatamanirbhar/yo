import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";
import { deleteProduct } from "../_actions";

export const dynamic = "force-dynamic";

export default async function ProductsAdminPage() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, slug, base_price, is_active, featured, images, category_id, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">+ New product</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 font-medium">Image</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(products ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded" />
                  )}
                </td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-600">
                  {/* @ts-expect-error supabase typed join */}
                  {p.categories?.name ?? "—"}
                </td>
                <td className="p-3 font-semibold">{formatINR(Number(p.base_price))}</td>
                <td className="p-3">{p.is_active ? "✓" : "—"}</td>
                <td className="p-3 text-right space-x-3">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-brand-600 hover:underline">
                    Edit
                  </Link>
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-red-600 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No products yet. <Link href="/admin/products/new" className="text-brand-600 hover:underline">Add your first product</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
