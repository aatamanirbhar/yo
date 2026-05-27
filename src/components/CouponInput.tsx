"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "@/lib/toast-store";
import { formatINR } from "@/lib/utils";
import { useCoupon } from "@/lib/coupon-store";
import { useCart } from "@/lib/cart-store";
import {
  computeCouponDiscount,
  isCouponMinMet,
} from "@/lib/coupon-math";

export default function CouponInput({ compact = false }: { compact?: boolean }) {
  const subtotal = useCart((s) => s.subtotal());
  const applied = useCoupon((s) => s.applied);
  const apply = useCoupon((s) => s.apply);
  const removeCoupon = useCoupon((s) => s.remove);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const liveDiscount = applied ? computeCouponDiscount(applied, subtotal) : 0;
  const minMet = applied ? isCouponMinMet(applied, subtotal) : true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setLoading(true);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, subtotal }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? "Invalid coupon");
      } else {
        apply({
          code: data.code,
          type: data.type,
          value: data.value,
          min_subtotal: data.min_subtotal,
          max_discount: data.max_discount,
        });
        toast.success(`Coupon applied: -${formatINR(data.discount)}`);
        setCode("");
      }
    } catch {
      toast.error("Could not apply coupon");
    } finally {
      setLoading(false);
    }
  }

  if (applied) {
    return (
      <div className="space-y-1.5">
        <div
          className={[
            "flex items-center justify-between rounded-md px-3 py-2 text-sm border",
            minMet
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-amber-50 border-amber-200 text-amber-800",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Tag size={14} className="flex-shrink-0" />
            <span className="truncate">
              <span className="font-mono font-semibold">{applied.code}</span>
              {minMet
                ? ` — saving ${formatINR(liveDiscount)}`
                : ` (₹${applied.min_subtotal} min not met)`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              removeCoupon();
              toast.info("Coupon removed");
            }}
            className="opacity-70 hover:opacity-100 flex-shrink-0 ml-2"
            aria-label="remove coupon"
          >
            <X size={14} />
          </button>
        </div>
        {!minMet && (
          <p className="text-xs text-amber-700">
            Add {formatINR(Number(applied.min_subtotal) - subtotal)} more to use this coupon.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className={`input flex-1 ${compact ? "py-1.5 text-sm" : ""}`}
        placeholder="Coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        autoComplete="off"
      />
      <button
        className={`btn-outline px-4 ${compact ? "py-1.5 text-sm" : ""}`}
        disabled={loading || !code.trim()}
      >
        {loading ? "..." : "Apply"}
      </button>
    </form>
  );
}
