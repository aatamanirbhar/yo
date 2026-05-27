import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import EditProductForm from "@/components/admin/EditProductForm";
import VariationsEditor from "@/components/admin/VariationsEditor";
import type { Product, ProductVariation } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!product) notFound();

  const [{ data: categories }, { data: variations }] = await Promise.all([
    admin.from("categories").select("id, name").order("sort_order"),
    admin
      .from("product_variations")
      .select("*")
      .eq("product_id", params.id)
      .order("created_at"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/products" className="text-sm text-brand-600 hover:underline">← Products</Link>
        <h1 className="text-2xl md:text-3xl font-display font-bold mt-1">Edit product</h1>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Details</h2>
        <EditProductForm product={product as Product} categories={categories ?? []} />
      </section>

      <section>
        <h2 className="font-semibold mb-3">Variations</h2>
        <p className="text-sm text-gray-500 mb-3">
          Add size/color/etc. variants. Price defaults to base price if no variation is selected.
        </p>
        <VariationsEditor
          productId={params.id}
          variations={(variations ?? []) as ProductVariation[]}
        />
      </section>
    </div>
  );
}
