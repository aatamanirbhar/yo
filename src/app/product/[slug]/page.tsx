import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductActions from "@/components/ProductActions";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import type { Product, ProductVariation, Category } from "@/types/db";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();
  const p = product as Product;

  const [{ data: variations }, { data: category }, { data: related }] = await Promise.all([
    supabase
      .from("product_variations")
      .select("*")
      .eq("product_id", p.id)
      .order("created_at"),
    p.category_id
      ? supabase.from("categories").select("*").eq("id", p.category_id).single()
      : Promise.resolve({ data: null }),
    p.category_id
      ? supabase
          .from("products")
          .select("*")
          .eq("category_id", p.category_id)
          .eq("is_active", true)
          .neq("id", p.id)
          .limit(4)
      : Promise.resolve({ data: [] }),
  ]);

  const vars: ProductVariation[] = variations ?? [];
  const cat = category as Category | null;
  const relatedProducts: Product[] = (related as Product[]) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        {cat && (
          <>
            {" / "}
            <Link href={`/category/${cat.slug}`} className="hover:text-brand-600">
              {cat.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-gray-700">{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={p.images ?? []} name={p.name} />

        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-3">{p.name}</h1>
          {p.description && (
            <p className="text-gray-600 mb-6 whitespace-pre-line">{p.description}</p>
          )}
          <ProductActions product={p} variations={vars} />
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl md:text-2xl font-display font-bold mb-5">
            You may also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
