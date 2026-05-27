export type UUID = string;

export type Category = {
  id: UUID;
  slug: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: UUID | null;
  images: string[];
  is_active: boolean;
  featured: boolean;
  created_at: string;
};

export type ProductVariation = {
  id: UUID;
  product_id: UUID;
  name: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  sku: string | null;
  created_at: string;
};

export type ProductWithVariations = Product & {
  variations: ProductVariation[];
  category?: Pick<Category, "id" | "slug" | "name"> | null;
};

export type Profile = {
  id: UUID;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

export type Order = {
  id: UUID;
  order_number: string;
  user_id: UUID | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
};

export type OrderItem = {
  id: UUID;
  order_id: UUID;
  product_id: UUID | null;
  variation_id: UUID | null;
  product_name: string;
  variation_name: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type Coupon = {
  id: UUID;
  code: string;
  type: "percent" | "flat";
  value: number;
  min_subtotal: number;
  max_discount: number | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
};
