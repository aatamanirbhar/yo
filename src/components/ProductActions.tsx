"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { toast } from "@/lib/toast-store";
import { formatINR } from "@/lib/utils";
import WishlistButton from "@/components/WishlistButton";
import type { Product, ProductVariation } from "@/types/db";

export default function ProductActions({
  product,
  variations,
}: {
  product: Product;
  variations: ProductVariation[];
}) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const hasVariations = variations.length > 0;
  const [selectedId, setSelectedId] = useState<string | null>(
    hasVariations ? variations[0].id : null,
  );
  const [qty, setQty] = useState(1);

  const selected = variations.find((v) => v.id === selectedId);
  const price = selected ? Number(selected.price) : Number(product.base_price);
  const stock = selected ? selected.stock : Infinity;
  const outOfStock = hasVariations && (!selected || selected.stock <= 0);
  const image = product.images?.[0] ?? null;

  function build() {
    return {
      productId: product.id,
      variationId: selected?.id ?? null,
      productSlug: product.slug,
      name: product.name,
      variationName: selected?.name ?? null,
      price,
      image,
      quantity: Math.min(qty, stock === Infinity ? qty : stock),
      maxStock: stock === Infinity ? undefined : stock,
    };
  }

  function addToCart() {
    if (outOfStock) return;
    add(build());
    toast.success(`Added "${product.name}" to cart`);
  }
  function buyNow() {
    if (outOfStock) return;
    add(build());
    router.push("/checkout");
  }

  const lowStock = !outOfStock && selected && selected.stock > 0 && selected.stock <= 5;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-semibold">{formatINR(price)}</p>
        <WishlistButton
          productId={product.id}
          slug={product.slug}
          name={product.name}
          price={price}
          image={image}
          size={20}
        />
      </div>

      {lowStock && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md inline-block">
          🔥 Only {selected!.stock} left — order soon!
        </p>
      )}

      {hasVariations && (
        <div>
          <label className="label">Variation</label>
          <div className="flex flex-wrap gap-2">
            {variations.map((v) => {
              const isOut = v.stock <= 0;
              const isSel = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  disabled={isOut}
                  className={[
                    "px-3 py-2 rounded-md border text-sm transition-colors",
                    isSel
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-300 hover:border-gray-400",
                    isOut ? "opacity-50 line-through cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {v.name}
                  {isOut && " (out)"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="label">Quantity</label>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline px-3 py-1"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-10 text-center">{qty}</span>
          <button
            className="btn-outline px-3 py-1"
            onClick={() =>
              setQty((q) => Math.min(stock === Infinity ? q + 1 : stock, q + 1))
            }
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          className="btn-secondary flex-1 py-3 text-base"
          disabled={outOfStock}
          onClick={addToCart}
        >
          {outOfStock ? "Out of stock" : "Add to Cart"}
        </button>
        <button
          className="btn-primary flex-1 py-3 text-base"
          disabled={outOfStock}
          onClick={buyNow}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
