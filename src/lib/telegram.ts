import { formatINR } from "./utils";

type Order = {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  shipping_fee: number;
  discount_amount?: number;
  coupon_code?: string | null;
  total: number;
};

type Item = {
  product_name: string;
  variation_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyAdminNewOrder({
  order,
  items,
}: {
  order: Order;
  items: Item[];
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram not configured; skipping admin notify.");
    return;
  }

  const lines: string[] = [];
  lines.push(`<b>🛍️ New Order — ${escapeHtml(order.order_number)}</b>`);
  lines.push("");
  lines.push(`<b>Customer:</b> ${escapeHtml(order.customer_name)}`);
  lines.push(`<b>Email:</b> ${escapeHtml(order.customer_email)}`);
  lines.push(`<b>Phone:</b> ${escapeHtml(order.customer_phone)}`);
  lines.push("");
  lines.push("<b>Items:</b>");
  for (const it of items) {
    const varTxt = it.variation_name ? ` (${escapeHtml(it.variation_name)})` : "";
    lines.push(
      `• ${escapeHtml(it.product_name)}${varTxt} × ${it.quantity} — ${formatINR(it.subtotal)}`,
    );
  }
  lines.push("");
  lines.push(`<b>Subtotal:</b> ${formatINR(order.subtotal)}`);
  if (Number(order.discount_amount ?? 0) > 0) {
    const tag = order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : "";
    lines.push(`<b>Discount${tag}:</b> −${formatINR(Number(order.discount_amount))}`);
  }
  if (Number(order.shipping_fee) > 0)
    lines.push(`<b>Shipping:</b> ${formatINR(order.shipping_fee)}`);
  lines.push(`<b>Total:</b> ${formatINR(order.total)}`);
  lines.push("");
  lines.push("<b>Ship to:</b>");
  lines.push(
    `${escapeHtml(order.shipping_address.line1)}${order.shipping_address.line2 ? `, ${escapeHtml(order.shipping_address.line2)}` : ""}`,
  );
  lines.push(
    `${escapeHtml(order.shipping_address.city)}, ${escapeHtml(order.shipping_address.state)} ${escapeHtml(order.shipping_address.pincode)}`,
  );

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Telegram notify failed:", res.status, txt);
  }
}
