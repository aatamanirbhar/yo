"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/app/admin/_actions";

type Cat = { id: string; name: string };

export default function NewProductForm({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const id = await createProduct(formData);
      router.push(`/admin/products/${id}/edit`);
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <form action={action} className="space-y-4 max-w-2xl">
      <div>
        <label className="label">Name</label>
        <input name="name" required className="input" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={4} className="input" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Base price (₹)</label>
          <input name="base_price" type="number" min="0" step="0.01" required className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category_id" className="input">
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
          placeholder="https://...&#10;https://..."
        />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input name="is_active" type="checkbox" defaultChecked /> Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="featured" type="checkbox" /> Featured on homepage
        </label>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm">{error}</div>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Creating..." : "Create & add variations"}
      </button>
    </form>
  );
}
