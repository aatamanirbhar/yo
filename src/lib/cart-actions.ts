"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClientCartLine = {
  productId: string;
  variationId: string | null;
  quantity: number;
};

export type SyncedCartItem = {
  productId: string;
  variationId: string | null;
  productSlug: string;
  name: string;
  variationName: string | null;
  price: number;
  image: string | null;
  quantity: number;
  maxStock?: number;
};

function clampQty(q: number): number {
  return Math.max(1, Math.min(99, Math.floor(q)));
}

async function getUserId(): Promise<string | null> {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}

/** Replace the user's server cart with the supplied lines (full replace). */
export async function pushCart(items: ClientCartLine[]): Promise<{
  synced: boolean;
}> {
  const userId = await getUserId();
  if (!userId) return { synced: false };

  const admin = createAdminClient();
  await admin.from("cart_items").delete().eq("user_id", userId);

  const valid = items.filter(
    (i) => i.productId && i.quantity > 0,
  );
  if (valid.length === 0) return { synced: true };

  // Deduplicate by (productId, variationId)
  const map = new Map<string, ClientCartLine>();
  for (const i of valid) {
    const key = `${i.productId}|${i.variationId ?? "_"}`;
    const prev = map.get(key);
    map.set(
      key,
      prev
        ? { ...i, quantity: clampQty(prev.quantity + i.quantity) }
        : { ...i, quantity: clampQty(i.quantity) },
    );
  }

  await admin.from("cart_items").insert(
    Array.from(map.values()).map((i) => ({
      user_id: userId,
      product_id: i.productId,
      variation_id: i.variationId,
      quantity: i.quantity,
    })),
  );

  return { synced: true };
}

/**
 * Merge supplied local cart lines with the user's server cart (union by
 * product+variation, take the MAX quantity for duplicates), persist the
 * merged result, and return enriched items ready to drop into the client
 * cart store.
 */
export async function mergeAndSyncCart(
  localItems: ClientCartLine[],
): Promise<{ synced: boolean; items: SyncedCartItem[] }> {
  const userId = await getUserId();
  if (!userId) return { synced: false, items: [] };

  const admin = createAdminClient();

  const { data: serverRows } = await admin
    .from("cart_items")
    .select("product_id, variation_id, quantity")
    .eq("user_id", userId);

  const key = (p: string, v: string | null) => `${p}|${v ?? "_"}`;
  const merged = new Map<string, ClientCartLine>();

  for (const r of serverRows ?? []) {
    merged.set(key(r.product_id, r.variation_id), {
      productId: r.product_id,
      variationId: r.variation_id,
      quantity: r.quantity,
    });
  }
  for (const l of localItems ?? []) {
    if (!l.productId || l.quantity <= 0) continue;
    const k = key(l.productId, l.variationId);
    const existing = merged.get(k);
    if (existing) {
      existing.quantity = clampQty(Math.max(existing.quantity, l.quantity));
    } else {
      merged.set(k, { ...l, quantity: clampQty(l.quantity) });
    }
  }

  const mergedArr = Array.from(merged.values());

  // Persist merged cart
  await admin.from("cart_items").delete().eq("user_id", userId);
  if (mergedArr.length > 0) {
    await admin.from("cart_items").insert(
      mergedArr.map((i) => ({
        user_id: userId,
        product_id: i.productId,
        variation_id: i.variationId,
        quantity: i.quantity,
      })),
    );
  }

  // Enrich for client display
  if (mergedArr.length === 0) return { synced: true, items: [] };

  const productIds = [...new Set(mergedArr.map((i) => i.productId))];
  const variationIds = mergedArr
    .map((i) => i.variationId)
    .filter((v): v is string => !!v);

  const [{ data: products }, { data: variations }] = await Promise.all([
    admin
      .from("products")
      .select("id, slug, name, base_price, images, is_active")
      .in("id", productIds),
    variationIds.length
      ? admin
          .from("product_variations")
          .select("id, name, price, stock")
          .in("id", variationIds)
      : Promise.resolve({ data: [] }),
  ]);

  type PRow = NonNullable<typeof products>[number];
  type VRow = NonNullable<typeof variations>[number];
  const productMap = new Map<string, PRow>(
    (products ?? []).map((p) => [p.id, p]),
  );
  const variationMap = new Map<string, VRow>(
    (variations ?? []).map((v) => [v.id, v]),
  );

  const enriched: SyncedCartItem[] = [];
  for (const i of mergedArr) {
    const p = productMap.get(i.productId);
    if (!p || !p.is_active) continue;
    const v = i.variationId ? variationMap.get(i.variationId) : null;
    enriched.push({
      productId: i.productId,
      variationId: i.variationId,
      productSlug: p.slug,
      name: p.name,
      variationName: v?.name ?? null,
      price: v ? Number(v.price) : Number(p.base_price),
      image: p.images?.[0] ?? null,
      quantity: i.quantity,
      maxStock: v?.stock,
    });
  }

  return { synced: true, items: enriched };
}
