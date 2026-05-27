"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-store";
import { toast } from "@/lib/toast-store";

type Props = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  className?: string;
  size?: number;
};

export default function WishlistButton({
  productId,
  slug,
  name,
  price,
  image,
  className = "",
  size = 18,
}: Props) {
  const has = useWishlist((s) => s.has(productId));
  const toggle = useWishlist((s) => s.toggle);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const saved = toggle({ productId, slug, name, price, image });
    toast.success(saved ? `Added "${name}" to wishlist` : `Removed from wishlist`);
  }

  return (
    <button
      onClick={onClick}
      aria-label={has ? "remove from wishlist" : "add to wishlist"}
      className={[
        "p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors",
        has ? "text-red-500" : "text-gray-500 hover:text-red-500",
        className,
      ].join(" ")}
    >
      <Heart size={size} fill={has ? "currentColor" : "none"} />
    </button>
  );
}
