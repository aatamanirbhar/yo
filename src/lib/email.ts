import nodemailer from "nodemailer";
import { formatINR } from "./utils";

type Order = {
  id: string;
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
  unit_price: number;
  quantity: number;
  subtotal: number;
};

let _transporter: nodemailer.Transporter | null = null;
function transporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    });
  }
  return _transporter;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendOrderConfirmationEmail({
  order,
  items,
}: {
  order: Order;
  items: Item[];
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured; skipping email.");
    return;
  }

  const storeName = process.env.STORE_NAME || "Radharani Collection";
  const itemRows = items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;">
            ${escape(it.product_name)}${it.variation_name ? ` <span style="color:#666;">— ${escape(it.variation_name)}</span>` : ""}
            <div style="color:#666;font-size:12px;">Qty ${it.quantity} × ${formatINR(it.unit_price)}</div>
          </td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">
            ${formatINR(it.subtotal)}
          </td>
        </tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
    <div style="background:#db2777;color:#fff;padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:22px;">${escape(storeName)}</h1>
    </div>
    <div style="padding:24px;">
      <h2 style="margin:0 0 12px;">Thank you for your order, ${escape(order.customer_name)}!</h2>
      <p style="color:#555;">We&apos;ve received your order. Here are the details:</p>

      <p style="margin:16px 0;">
        <strong>Order #:</strong> ${escape(order.order_number)}<br>
      </p>

      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        ${itemRows}
        <tr>
          <td style="padding:8px 4px;text-align:right;color:#555;">Subtotal</td>
          <td style="padding:8px 4px;text-align:right;">${formatINR(order.subtotal)}</td>
        </tr>
        ${
          Number(order.discount_amount ?? 0) > 0
            ? `<tr>
          <td style="padding:8px 4px;text-align:right;color:#15803d;">Discount${order.coupon_code ? ` (${escape(order.coupon_code)})` : ""}</td>
          <td style="padding:8px 4px;text-align:right;color:#15803d;">−${formatINR(Number(order.discount_amount))}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding:8px 4px;text-align:right;color:#555;">Shipping</td>
          <td style="padding:8px 4px;text-align:right;">${Number(order.shipping_fee) > 0 ? formatINR(order.shipping_fee) : "Free"}</td>
        </tr>
        <tr>
          <td style="padding:12px 4px;text-align:right;font-weight:700;border-top:2px solid #111;">Total</td>
          <td style="padding:12px 4px;text-align:right;font-weight:700;border-top:2px solid #111;">${formatINR(order.total)}</td>
        </tr>
      </table>

      <h3 style="margin-top:24px;">Shipping address</h3>
      <p style="color:#555;line-height:1.5;">
        ${escape(order.customer_name)}<br>
        ${escape(order.shipping_address.line1)}${order.shipping_address.line2 ? `, ${escape(order.shipping_address.line2)}` : ""}<br>
        ${escape(order.shipping_address.city)}, ${escape(order.shipping_address.state)} ${escape(order.shipping_address.pincode)}<br>
        Phone: ${escape(order.customer_phone)}
      </p>

      <p style="color:#888;font-size:12px;margin-top:32px;">
        Questions? Reply to this email and we&apos;ll be in touch.
      </p>
    </div>
  </div>`;

  await transporter().sendMail({
    from: `"${storeName}" <${process.env.GMAIL_USER}>`,
    to: order.customer_email,
    subject: `Order confirmation — ${order.order_number}`,
    html,
  });
}
