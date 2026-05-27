import Link from "next/link";
import type { Product } from "@/types/db";
import { formatINR } from "@/lib/utils";
import WishlistButton from "@/components/WishlistButton";

const NEW_DAYS = 30;

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const isNew =
    Date.now() - new Date(product.created_at).getTime() <
    NEW_DAYS * 24 * 60 * 60 * 1000;

  return (
    <div className="group relative card hover:shadow-md transition-shadow flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="block aspect-square bg-gray-100 overflow-hidden"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </Link>

      {isNew && (
        <span className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded">
          New
        </span>
      )}

      <div className="absolute top-2 right-2">
        <WishlistButton
          productId={product.id}
          slug={product.slug}
          name={product.name}
          price={Number(product.base_price)}
          image={image ?? null}
          size={16}
        />
      </div>

      <Link href={`/product/${product.slug}`} className="p-3 block">
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-brand-600">
          {product.name}
        </h3>
        <p className="text-base font-semibold mt-1">
          {formatINR(product.base_price)}
        </p>
      </Link>
    </div>
  );
}
