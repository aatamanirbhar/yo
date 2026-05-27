import Razorpay from "razorpay";
import crypto from "crypto";

let _client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return _client;
}

export async function createRazorpayOrder(opts: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return razorpay().orders.create({
    amount: opts.amountInPaise,
    currency: "INR",
    receipt: opts.receipt,
    notes: opts.notes,
  });
}

export function verifyRazorpaySignature(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const body = `${opts.razorpayOrderId}|${opts.razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(opts.signature),
  );
}
