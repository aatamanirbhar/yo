"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { PackageCheck, Package, Truck, Home, XCircle, Clock } from "lucide-react";

type Item = {
  product_name: string;
  variation_name: string | null;
  quantity: number;
  subtotal: number;
};

type OrderInfo = {
  order_number: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  payment_status: string;
  customer_name: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total: number;
  created_at: string;
  items: Item[];
};

const STEPS: { key: OrderInfo["status"]; label: string; Icon: typeof Package }[] = [
  { key: "pending", label: "Placed", Icon: Clock },
  { key: "paid", label: "Confirmed", Icon: PackageCheck },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: Home },
];

export default function TrackClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not find that order");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Track your order</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Enter your order number and the email used at checkout.
      </p>

      <form onSubmit={submit} className="card p-5 space-y-3 mb-6">
        <div>
          <label className="label">Order number</label>
          <input
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="RC..."
            className="input font-mono"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Looking up..." : "Track order"}
        </button>
        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}
      </form>

      {order && (
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Order #</p>
              <p className="font-mono font-semibold">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Placed</p>
              <p className="text-sm">
                {new Date(order.created_at).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {order.status === "cancelled" ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm flex items-center gap-2">
              <XCircle size={18} /> This order was cancelled.
            </div>
          ) : (
            <ol className="flex items-center justify-between">
              {STEPS.map((step, i) => {
                const currentIndex = STEPS.findIndex((s) => s.key === order.status);
                const done = i <= currentIndex;
                return (
                  <li key={step.key} className="flex-1 flex flex-col items-center text-center">
                    <div
                      className={[
                        "h-9 w-9 rounded-full flex items-center justify-center",
                        done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-400",
                      ].join(" ")}
                    >
                      <step.Icon size={18} />
                    </div>
                    <p className={`text-xs mt-1.5 ${done ? "font-semibold" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}

          <div>
            <h3 className="font-semibold mb-2 text-sm">Items</h3>
            <ul className="divide-y text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span>
                    {it.product_name}
                    {it.variation_name && (
                      <span className="text-gray-500"> — {it.variation_name}</span>
                    )}
                    <span className="text-gray-500"> × {it.quantity}</span>
                  </span>
                  <span className="font-medium">{formatINR(it.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatINR(order.discount_amount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping_fee > 0 ? formatINR(order.shipping_fee) : "Free"}</span></div>
              <div className="flex justify-between font-semibold pt-1 border-t mt-1"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">Shipping to</h3>
            <p className="text-gray-600">
              {order.customer_name}<br />
              {order.shipping_address.line1}
              {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}<br />
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
