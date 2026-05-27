import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import NewProductForm from "@/components/admin/NewProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const admin = createAdminClient();
  const { data: categories } = await admin
    .from("categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-brand-600 hover:underline">← Products</Link>
        <h1 className="text-2xl md:text-3xl font-display font-bold mt-1">New product</h1>
      </div>
      <NewProductForm categories={categories ?? []} />
    </div>
  );
}
