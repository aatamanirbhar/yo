"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { toast } from "@/lib/toast-store";
import { formatINR } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function WishlistGrid() {
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const add = useCart((s) => s.add);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return <div className="text-gray-400">Loading...</div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
        <Link href="/" className="btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {items.map((it) => (
        <div key={it.productId} className="card overflow-hidden flex flex-col">
          <Link href={`/product/${it.slug}`} className="block aspect-square bg-gray-100">
            {it.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
            )}
          </Link>
          <div className="p-3 flex-1 flex flex-col">
            <Link
              href={`/product/${it.slug}`}
              className="text-sm font-medium line-clamp-2 hover:text-brand-600"
            >
              {it.name}
            </Link>
            <p className="text-base font-semibold mt-1 mb-3">{formatINR(it.price)}</p>
            <div className="mt-auto flex gap-2">
              <button
                className="btn-primary text-xs py-1.5 flex-1"
                onClick={() => {
                  add({
                    productId: it.productId,
                    variationId: null,
                    productSlug: it.slug,
                    name: it.name,
                    variationName: null,
                    price: it.price,
                    image: it.image,
                    quantity: 1,
                  });
                  toast.success(`Added "${it.name}" to cart`);
                }}
              >
                Add to cart
              </button>
              <button
                className="btn-outline px-2 py-1.5"
                onClick={() => {
                  remove(it.productId);
                  toast.info(`Removed from wishlist`);
                }}
                aria-label="remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
