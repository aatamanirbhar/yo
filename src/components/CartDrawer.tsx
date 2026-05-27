"use client";

import Link from "next/link";
import { X, Minus, Plus, Trash2, Tag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useCoupon } from "@/lib/coupon-store";
import { computeCouponDiscount, isCouponMinMet } from "@/lib/coupon-math";
import { formatINR } from "@/lib/utils";
import CouponInput from "@/components/CouponInput";

export default function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const applied = useCoupon((s) => s.applied);

  const discount =
    applied && isCouponMinMet(applied, subtotal)
      ? computeCouponDiscount(applied, subtotal)
      : 0;
  const estTotal = Math.max(0, subtotal - discount);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart ({items.length})</h2>
          <button onClick={close} aria-label="close cart" className="p-1 hover:bg-gray-100 rounded">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <p className="mb-4">Your cart is empty</p>
              <button onClick={close} className="btn-outline">Continue shopping</button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variationId ?? "base"}`}
                  className="flex gap-3"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productSlug}`}
                      onClick={close}
                      className="text-sm font-medium hover:text-brand-600 line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    {item.variationName && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variationName}</p>
                    )}
                    <p className="text-sm font-semibold mt-1">{formatINR(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded">
                        <button
                          className="p-1.5 hover:bg-gray-100"
                          onClick={() => setQty(item.productId, item.variationId, item.quantity - 1)}
                          aria-label="decrease"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          className="p-1.5 hover:bg-gray-100"
                          onClick={() => setQty(item.productId, item.variationId, item.quantity + 1)}
                          aria-label="increase"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-600"
                        onClick={() => remove(item.productId, item.variationId)}
                        aria-label="remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <Tag size={12} /> Have a coupon?
              </div>
              <CouponInput compact />
            </div>

            <div className="space-y-1 text-sm pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount{applied ? ` (${applied.code})` : ""}</span>
                  <span>−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-1.5 border-t mt-1">
                <span>Estimated total</span>
                <span>{formatINR(estTotal)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Shipping calculated at checkout based on your address.
            </p>

            <Link
              href="/checkout"
              onClick={close}
              className="btn-primary w-full"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
