"use client";

import { useState } from "react";
import { updateProduct } from "@/app/admin/_actions";
import type { Product } from "@/types/db";

type Cat = { id: string; name: string };

export default function EditProductForm({
  product,
  categories,
}: {
  product: Product;
  categories: Cat[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      await updateProduct(formData);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <input type="hidden" name="id" value={product.id} />
      <div>
        <label className="label">Name</label>
        <input name="name" required className="input" defaultValue={product.name} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={4} className="input" defaultValue={product.description ?? ""} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Base price (₹)</label>
          <input
            name="base_price"
            type="number"
            min="0"
            step="0.01"
            required
            className="input"
            defaultValue={product.base_price}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category_id" className="input" defaultValue={product.category_id ?? ""}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Image URLs (one per line)</label>
        <textarea
          name="images"
          rows={3}
          className="input font-mono text-xs"
          defaultValue={(product.images ?? []).join("\n")}
        />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input name="is_active" type="checkbox" defaultChecked={product.is_active} /> Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="featured" type="checkbox" defaultChecked={product.featured} /> Featured on homepage
        </label>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm">{error}</div>}
      {saved && <div className="bg-green-50 border border-green-200 text-green-700 p-2.5 rounded text-sm">Saved.</div>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
    </form>
  );
}
