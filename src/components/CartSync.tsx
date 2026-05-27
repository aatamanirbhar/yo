"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart, type CartItem } from "@/lib/cart-store";
import {
  mergeAndSyncCart,
  pushCart,
  type ClientCartLine,
} from "@/lib/cart-actions";

function lineKey(items: CartItem[]): string {
  return JSON.stringify(
    items.map((i) => [i.productId, i.variationId, i.quantity]),
  );
}

function toLines(items: CartItem[]): ClientCartLine[] {
  return items.map((i) => ({
    productId: i.productId,
    variationId: i.variationId,
    quantity: i.quantity,
  }));
}

/**
 * Mounted once at the root. Keeps the localStorage cart in sync with the
 * authenticated user's server cart. No UI.
 */
export default function CartSync() {
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    let loggedIn = false;
    let lastSynced = lineKey(useCart.getState().items);
    let pushTimer: ReturnType<typeof setTimeout> | null = null;

    async function performMerge() {
      const local = toLines(useCart.getState().items);
      const result = await mergeAndSyncCart(local);
      if (!mounted || !result.synced) return;
      const cartItems: CartItem[] = result.items.map((m) => ({
        productId: m.productId,
        variationId: m.variationId,
        productSlug: m.productSlug,
        name: m.name,
        variationName: m.variationName,
        price: m.price,
        image: m.image,
        quantity: m.quantity,
        maxStock: m.maxStock,
      }));
      useCart.getState().replaceAll(cartItems);
      lastSynced = lineKey(cartItems);
    }

    // Initial check
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) {
        loggedIn = true;
        await performMerge();
      }
    })();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        const already = loggedIn;
        loggedIn = true;
        if (!already) await performMerge();
      } else if (event === "SIGNED_OUT") {
        loggedIn = false;
        // Start fresh on this browser so the next user doesn't inherit a cart
        useCart.getState().clear();
        lastSynced = lineKey([]);
      }
    });

    // Push local cart changes (debounced) to the server while logged in
    const unsub = useCart.subscribe((s) => {
      if (!loggedIn) return;
      const next = lineKey(s.items);
      if (next === lastSynced) return;

      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(async () => {
        const items = toLines(useCart.getState().items);
        const key = lineKey(useCart.getState().items);
        try {
          await pushCart(items);
          lastSynced = key;
        } catch {
          /* silent — next mutation will retry */
        }
      }, 600);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsub();
      if (pushTimer) clearTimeout(pushTimer);
    };
  }, []);

  return null;
}
