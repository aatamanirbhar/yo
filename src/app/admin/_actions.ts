"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

async function guard() {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
}

// ---------- Categories ----------

export async function createCategory(formData: FormData) {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  if (!name) throw new Error("Name required");
  const slug = slugify(name);
  const admin = createAdminClient();
  const { error } = await admin
    .from("categories")
    .insert({ name, slug, image_url: imageUrl || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

// ---------- Products ----------

export async function createProduct(formData: FormData) {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const base_price = Number(formData.get("base_price"));
  const category_id = String(formData.get("category_id") ?? "") || null;
  const imagesRaw = String(formData.get("images") ?? "");
  const is_active = formData.get("is_active") === "on";
  const featured = formData.get("featured") === "on";

  if (!name) throw new Error("Name required");
  if (!Number.isFinite(base_price) || base_price < 0)
    throw new Error("Invalid price");

  const images = imagesRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .insert({
      name,
      slug,
      description: description || null,
      base_price,
      category_id,
      images,
      is_active,
      featured,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  return data.id as string;
}

export async function updateProduct(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "");
  const base_price = Number(formData.get("base_price"));
  const category_id = String(formData.get("category_id") ?? "") || null;
  const imagesRaw = String(formData.get("images") ?? "");
  const is_active = formData.get("is_active") === "on";
  const featured = formData.get("featured") === "on";

  const images = imagesRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({
      name,
      description: description || null,
      base_price,
      category_id,
      images,
      is_active,
      featured,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ---------- Variations ----------

export async function createVariation(formData: FormData) {
  await guard();
  const product_id = String(formData.get("product_id"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const sku = String(formData.get("sku") ?? "").trim() || null;
  if (!name) throw new Error("Variation name required");
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");

  const admin = createAdminClient();
  const { error } = await admin.from("product_variations").insert({
    product_id,
    name,
    price,
    stock: Number.isFinite(stock) ? stock : 0,
    sku,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/products/${product_id}/edit`);
}

export async function updateVariation(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const product_id = String(formData.get("product_id"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const sku = String(formData.get("sku") ?? "").trim() || null;

  const admin = createAdminClient();
  const { error } = await admin
    .from("product_variations")
    .update({ name, price, stock, sku })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/products/${product_id}/edit`);
}

export async function deleteVariation(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const product_id = String(formData.get("product_id"));
  const admin = createAdminClient();
  const { error } = await admin.from("product_variations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/products/${product_id}/edit`);
}

// ---------- Coupons ----------

export async function createCoupon(formData: FormData) {
  await guard();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "percent");
  const value = Number(formData.get("value"));
  const min_subtotal = Number(formData.get("min_subtotal") ?? 0);
  const max_discount_raw = String(formData.get("max_discount") ?? "");
  const expires_at = String(formData.get("expires_at") ?? "");
  const usage_limit_raw = String(formData.get("usage_limit") ?? "");
  const is_active = formData.get("is_active") === "on";

  if (!code) throw new Error("Code required");
  if (!["percent", "flat"].includes(type)) throw new Error("Invalid type");
  if (!Number.isFinite(value) || value <= 0) throw new Error("Invalid value");

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").insert({
    code,
    type,
    value,
    min_subtotal: Number.isFinite(min_subtotal) ? min_subtotal : 0,
    max_discount: max_discount_raw ? Number(max_discount_raw) : null,
    expires_at: expires_at ? new Date(expires_at).toISOString() : null,
    usage_limit: usage_limit_raw ? Number(usage_limit_raw) : null,
    is_active,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  const { error } = await admin.from("coupons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const is_active = formData.get("is_active") === "true";
  const admin = createAdminClient();
  const { error } = await admin
    .from("coupons")
    .update({ is_active: !is_active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

// ---------- Orders ----------

export async function updateOrderStatus(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const valid = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  const admin = createAdminClient();
  const { error } = await admin.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
