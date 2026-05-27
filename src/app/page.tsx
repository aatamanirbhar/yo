import { createClient } from "@/lib/supabase/server";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import type { Category, Product } from "@/types/db";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const cats: Category[] = categories ?? [];
  const prods: Product[] = products ?? [];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-brand-100 border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            Radharani Collection
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Curated fashion for everyone — discover the latest in men&apos;s, women&apos;s,
            kids&apos; & accessories.
          </p>
          <Link href="/category/women" className="btn-primary text-base px-7 py-3">
            Shop Now
          </Link>
        </div>
      </section>

      {cats.length > 0 && <CategoryGrid categories={cats} />}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold">Featured products</h2>
        </div>
        {prods.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">
            No products yet. Sign in as admin and add your first product.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {prods.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
