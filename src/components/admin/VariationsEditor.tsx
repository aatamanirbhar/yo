"use client";

import { useState } from "react";
import {
  createVariation,
  updateVariation,
  deleteVariation,
} from "@/app/admin/_actions";
import type { ProductVariation } from "@/types/db";
import { Trash2 } from "lucide-react";

export default function VariationsEditor({
  productId,
  variations,
}: {
  productId: string;
  variations: ProductVariation[];
}) {
  const [error, setError] = useState<string | null>(null);

  async function wrap(fn: (fd: FormData) => Promise<void>, fd: FormData) {
    setError(null);
    try {
      await fn(fd);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm">
          {error}
        </div>
      )}

      <div className="card divide-y">
        <div className="hidden sm:grid grid-cols-[1fr_120px_80px_120px_auto_auto] gap-2 p-2 bg-gray-50 text-xs font-medium text-gray-600">
          <span>Name</span>
          <span>Price (₹)</span>
          <span>Stock</span>
          <span>SKU</span>
          <span></span>
          <span></span>
        </div>

        {variations.map((v) => (
          <div
            key={v.id}
            className="grid grid-cols-[1fr_120px_80px_120px_auto_auto] gap-2 p-2 items-center"
          >
            <form
              action={(fd) => wrap(updateVariation, fd)}
              className="contents"
            >
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="product_id" value={productId} />
              <input name="name" defaultValue={v.name} required className="input py-1.5" />
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={v.price}
                required
                className="input py-1.5"
              />
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={v.stock}
                className="input py-1.5"
              />
              <input
                name="sku"
                defaultValue={v.sku ?? ""}
                className="input py-1.5"
              />
              <button className="btn-outline py-1 px-3 text-xs">Save</button>
            </form>
            <form action={(fd) => wrap(deleteVariation, fd)}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="product_id" value={productId} />
              <button
                className="p-1.5 text-gray-400 hover:text-red-600"
                aria-label="delete"
                title="Delete variation"
              >
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        ))}

        {variations.length === 0 && (
          <p className="p-4 text-center text-gray-500 text-sm">
            No variations yet. Add one below.
          </p>
        )}
      </div>

      <form
        action={(fd) => wrap(createVariation, fd)}
        className="card p-3 grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_120px_auto] items-end gap-2"
      >
        <input type="hidden" name="product_id" value={productId} />
        <div>
          <label className="label">New variation</label>
          <input
            name="name"
            required
            className="input py-1.5"
            placeholder="e.g. Size M / Red"
          />
        </div>
        <div>
          <label className="label">Price</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            className="input py-1.5"
          />
        </div>
        <div>
          <label className="label">Stock</label>
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={0}
            className="input py-1.5"
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input name="sku" className="input py-1.5" />
        </div>
        <button className="btn-primary py-2 px-4">Add</button>
      </form>
    </div>
  );
}
