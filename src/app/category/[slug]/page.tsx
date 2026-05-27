import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Category, Product } from "@/types/db";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", (category as Category).id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const prods: Product[] = products ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
        {(category as Category).name}
      </h1>
      <p className="text-gray-500 mb-8">
        {prods.length} product{prods.length === 1 ? "" : "s"}
      </p>
      {prods.length === 0 ? (
        <p className="text-gray-500 py-16 text-center">
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {prods.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
