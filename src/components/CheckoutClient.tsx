"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/utils";
import {
  haversineKm,
  isInStoreState,
  quoteShipping,
  STORE_LOCATION,
  FREE_RADIUS_KM,
  FREE_MIN_SUBTOTAL,
} from "@/lib/shipping";
import AddressAutocomplete, { type ResolvedPlace } from "./AddressAutocomplete";
import CouponInput from "./CouponInput";
import { useCoupon } from "@/lib/coupon-store";
import {
  computeCouponDiscount,
  isCouponMinMet,
} from "@/lib/coupon-math";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutClient({
  initialEmail,
  initialName,
}: {
  initialEmail: string;
  initialName: string;
}) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const appliedCoupon = useCoupon((s) => s.applied);
  const removeCoupon = useCoupon((s) => s.remove);

  const [form, setForm] = useState({
    name: initialName,
    email: initialEmail,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [location, setLocation] = useState<{
    lat: number | null;
    lng: number | null;
    formatted: string;
  }>({ lat: null, lng: null, formatted: "" });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  function change(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onPlace(p: ResolvedPlace) {
    setForm((f) => ({
      ...f,
      line1: p.line1 || f.line1,
      line2: p.line2 || f.line2,
      city: p.city || f.city,
      state: p.state || f.state,
      pincode: p.pincode || f.pincode,
    }));
    setLocation({ lat: p.lat, lng: p.lng, formatted: p.formatted });
  }

  // ---------- Shipping calculation (live) ----------
  const shippingQuote = useMemo(() => {
    const inState = form.state ? isInStoreState(form.state) : true; // default-in-state until known
    const distanceKm =
      location.lat !== null && location.lng !== null
        ? haversineKm(STORE_LOCATION, { lat: location.lat, lng: location.lng })
        : null;
    return quoteShipping({ subtotal, distanceKm, inStoreState: inState });
  }, [form.state, location.lat, location.lng, subtotal]);

  // ---------- Discount derived from persisted coupon store ----------
  const discount =
    appliedCoupon && isCouponMinMet(appliedCoupon, subtotal)
      ? computeCouponDiscount(appliedCoupon, subtotal)
      : 0;
  const total = Math.max(0, subtotal - discount + shippingQuote.fee);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          shipping: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          shippingLocation: {
            lat: location.lat,
            lng: location.lng,
            formatted: location.formatted || null,
          },
          coupon: appliedCoupon?.code ?? null,
          items: items.map((i) => ({
            productId: i.productId,
            variationId: i.variationId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setSubmitting(false);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        setError("Could not load payment SDK. Please try again.");
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Radharani Collection",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#db2777" },
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            clear();
            removeCoupon();
            router.push(`/order-success/${verifyData.orderNumber}`);
          } else {
            setError(verifyData.error || "Payment verification failed");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
      setSubmitting(false);
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-display font-bold mb-3">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products before checking out.</p>
        <Link href="/" className="btn-primary">Continue shopping</Link>
      </div>
    );
  }

  const couponBadge = appliedCoupon?.code ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={submit} className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold mb-3">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Full name</label>
                <input className="input" required value={form.name} onChange={(e) => change("name", e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" required value={form.email} onChange={(e) => change("email", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Phone</label>
                <input type="tel" className="input" required value={form.phone} onChange={(e) => change("phone", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold mb-1">Shipping address</h2>
            <p className="text-xs text-gray-500 mb-3">
              Pick your address from the dropdown — we use this to calculate exact shipping
              to your door.
            </p>

            <div className="mb-3">
              <label className="label">Search your address</label>
              <AddressAutocomplete onPlace={onPlace} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Address line 1</label>
                <input className="input" required value={form.line1} onChange={(e) => change("line1", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 2 (optional)</label>
                <input className="input" value={form.line2} onChange={(e) => change("line2", e.target.value)} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" required value={form.city} onChange={(e) => change("city", e.target.value)} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" required value={form.state} onChange={(e) => change("state", e.target.value)} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" required value={form.pincode} onChange={(e) => change("pincode", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold mb-3">Coupon code</h2>
            <CouponInput />
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={submitting}
          >
            {submitting ? "Processing..." : `Pay ${formatINR(total)}`}
          </button>
        </form>

        <aside className="card p-5 h-fit sticky top-20">
          <h2 className="font-semibold mb-3">Order summary</h2>
          <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
            {items.map((it) => (
              <li key={`${it.productId}-${it.variationId ?? "base"}`} className="py-3 flex gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-medium line-clamp-1">{it.name}</p>
                  {it.variationName && <p className="text-xs text-gray-500">{it.variationName}</p>}
                  <p className="text-xs text-gray-500">Qty {it.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatINR(it.price * it.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="border-t pt-3 mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount{couponBadge ? ` (${couponBadge})` : ""}</span>
                <span>−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck size={14} /> Shipping
              </span>
              <span>{shippingQuote.fee === 0 ? "FREE" : formatINR(shippingQuote.fee)}</span>
            </div>
            <p className="text-xs text-gray-500 pl-1">{shippingQuote.reason}</p>
            {!location.lat && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded mt-1">
                Pick from the address dropdown to lock in exact shipping.
              </p>
            )}

            <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          {subtotal < FREE_MIN_SUBTOTAL && (
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              💡 Add {formatINR(FREE_MIN_SUBTOTAL - subtotal)} more to qualify for free
              delivery (within {FREE_RADIUS_KM} km of our store in {STORE_LOCATION.state}).
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
