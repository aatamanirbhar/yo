/**
 * Shipping logic — used by both client (live preview at checkout) and
 * server (authoritative recompute in /api/checkout).
 *
 * Rules (per business spec):
 *   - Out-of-state: flat ₹111
 *   - In-state, ≤ FREE_RADIUS_KM, subtotal ≥ FREE_MIN: ₹0
 *   - In-state, ≤ FREE_RADIUS_KM, subtotal < FREE_MIN: ₹49 (min)
 *   - In-state, > FREE_RADIUS_KM: scales linearly from ₹49 toward ₹111
 */

export const STORE_LOCATION = {
  // These must be NEXT_PUBLIC_* — this file is imported by a client component
  // (CheckoutClient) which needs to compute live shipping in the browser.
  lat: Number(process.env.NEXT_PUBLIC_STORE_LATITUDE ?? 26.9124), // Jaipur city center
  lng: Number(process.env.NEXT_PUBLIC_STORE_LONGITUDE ?? 75.7873),
  state: (process.env.NEXT_PUBLIC_STORE_STATE ?? "Rajasthan").trim(),
};

export const FREE_RADIUS_KM = 0;
export const FREE_MIN_SUBTOTAL = 0;
export const SHIPPING_MIN = 0;
export const SHIPPING_MAX = 0;
export const PER_KM_BEYOND_FREE = 0;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function normaliseState(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function isInStoreState(state: string): boolean {
  return normaliseState(state) === normaliseState(STORE_LOCATION.state);
}

export type ShippingQuote = {
  fee: number;
  zone: "free" | "local" | "intra_state" | "out_of_state";
  distanceKm: number | null;
  reason: string;
};

export function quoteShipping({
  subtotal,
  distanceKm,
  inStoreState,
}: {
  subtotal: number;
  distanceKm: number | null;
  inStoreState: boolean;
}): ShippingQuote {
  if (!inStoreState) {
    return {
      fee: SHIPPING_MAX,
      zone: "out_of_state",
      distanceKm,
      reason: "Outside Rajasthan — flat ₹111",
    };
  }

  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    // Best-effort fallback: charge in-state minimum
    return {
      fee: SHIPPING_MIN,
      zone: "local",
      distanceKm: null,
      reason: "Within Rajasthan",
    };
  }

  if (distanceKm <= FREE_RADIUS_KM) {
    if (subtotal >= FREE_MIN_SUBTOTAL) {
      return {
        fee: 0,
        zone: "free",
        distanceKm,
        reason: `Free delivery (within ${FREE_RADIUS_KM} km, order ≥ ₹${FREE_MIN_SUBTOTAL})`,
      };
    }
    return {
      fee: SHIPPING_MIN,
      zone: "local",
      distanceKm,
      reason: `Local delivery (${distanceKm.toFixed(1)} km away)`,
    };
  }

  const extra = distanceKm - FREE_RADIUS_KM;
  const raw = SHIPPING_MIN + extra * PER_KM_BEYOND_FREE;
  const fee = Math.min(SHIPPING_MAX, Math.max(SHIPPING_MIN, Math.round(raw)));
  return {
    fee,
    zone: "intra_state",
    distanceKm,
    reason: `Within Rajasthan, ${distanceKm.toFixed(0)} km away`,
  };
}
