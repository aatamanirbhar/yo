import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let products: Product[] = [];
  if (q.length >= 2) {
    const escaped = q.replace(/%/g, "");
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(48);
    products = data ?? [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
        {q ? `Results for “${q}”` : "Search"}
      </h1>
      <p className="text-gray-500 mb-6">
        {q
          ? `${products.length} product${products.length === 1 ? "" : "s"} found`
          : "Type a query in the header search bar."}
      </p>

      {q && products.length === 0 && (
        <p className="text-center text-gray-500 py-16">
          No products match your search. Try a different keyword.
        </p>
      )}

      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
