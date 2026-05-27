# Radharani Collection

A full e-commerce site built with **Next.js 14** (App Router) + **Supabase** + **Razorpay** + **Nodemailer** + **Telegram Bot** + **Google Maps**.

## Features

- Browse products by category (men, women, kids, accessories — admin can add more)
- Product variations (size, color, etc.) with per-variant pricing & stock
- **Full-text product search** (header search bar + `/search` page)
- **Wishlist** (heart icon on every card, persists in browser, `/wishlist` page)
- Side-drawer cart, guest checkout **or** logged-in checkout
- **Google Maps address autocomplete at checkout** with live, distance-based shipping
- **Coupon codes** (percent or flat, with min order, max discount, expiry, usage limit)
- Razorpay payments (cards, UPI, netbanking)
- On successful order:
  - 📧 Email confirmation to customer via Gmail SMTP
  - 📲 Telegram notification to admin
- **Public order tracking** at `/track` (no login needed)
- Customer accounts with order history
- **Toast notifications** for cart / wishlist / coupon actions
- Admin dashboard: products CRUD, variations CRUD, categories CRUD, **coupons CRUD**, view orders, view users
- Product UX: image gallery with thumbnails, related products, low-stock indicator, "NEW" badge

## Shipping rules

| Where | Subtotal | Charge |
|---|---|---|
| Within 10 km of store, in Rajasthan | ≥ ₹1,000 | **FREE** |
| Within 10 km of store, in Rajasthan | < ₹1,000 | **₹49** |
| Rajasthan, > 10 km from store | any | **₹49 → ₹111** (scales by distance) |
| Outside Rajasthan | any | **₹111 flat** |

The store location is set via `STORE_LATITUDE`, `STORE_LONGITUDE`, `STORE_STATE` env vars (default = Jaipur). Distance is computed server-side using the Haversine formula from the lat/lng selected by Google Places Autocomplete — clients cannot spoof the distance.

---

## 1. Set up Supabase

1. Create a free project at https://supabase.com
2. In the SQL editor, paste & run `supabase/migrations/00001_init.sql` (schema + RLS + storage bucket + seed categories), **then** run `supabase/migrations/00002_features.sql` (coupons table + shipping/discount columns on orders).
3. Copy these values from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)

## 2. Set up Razorpay

1. Sign up at https://dashboard.razorpay.com (stay in **Test Mode** for dev)
2. **Settings → API Keys → Generate Test Key**
3. Fill `RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
4. Test card: `4111 1111 1111 1111`, any future expiry, any CVV

## 3. Set up Google Maps API

1. Go to https://console.cloud.google.com/google/maps-apis/
2. Create a project (or reuse one)
3. Enable **Maps JavaScript API** and **Places API**
4. **APIs & Services → Credentials → Create API Key**
5. Restrict the key:
   - **Application restrictions** → HTTP referrers → add `http://localhost:3000/*` and your prod URL
   - **API restrictions** → restrict to Maps JavaScript API + Places API
6. Fill `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`

> Note: Google requires billing to be enabled on the project, but Maps + Places have a generous monthly free tier ($200 credit) that easily covers a small store.

## 4. Set up Gmail SMTP

1. Enable 2-Step Verification on your Google account
2. Visit https://myaccount.google.com/apppasswords and generate an **App Password**
3. Fill `GMAIL_USER` and `GMAIL_APP_PASSWORD`

## 5. Set up Telegram bot

1. Message [`@BotFather`](https://t.me/BotFather) → `/newbot` → copy the token
2. Message your new bot any message ("hi")
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` → find `"chat":{"id":...}` — that's your chat id
4. Fill `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID`

## 6. Configure environment

```bash
cp .env.local.example .env.local
# edit .env.local and fill in everything above
```

## 7. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Promote your account to admin

After you sign up for the first time at `/auth/signup`, run this SQL in Supabase (replace the email):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

Now you can visit `/admin` to manage everything.

---

## Smoke test (end-to-end)

1. Sign up at `/auth/signup`, then promote yourself (above)
2. `/admin/products/new` → create a product with an image URL
3. Open the product → add a variation (e.g., "Small / Red", price, stock 10)
4. `/admin/coupons` → create a coupon `WELCOME10` (percent, value 10, min ₹500)
5. Sign out → click the product → **Buy Now**
6. At checkout, search your address in the Google Maps autocomplete (e.g. type "MI Road Jaipur") and select it
7. Watch the shipping fee update live in the summary based on distance + state
8. Apply coupon `WELCOME10` → see discount applied
9. Click Pay → Razorpay modal → test card `4111 1111 1111 1111`, `12/30`, CVV `123`
10. After success:
    - Email arrives at customer's inbox
    - Telegram message lands in admin chat
    - `/admin/orders` shows order with distance + zone
    - Try `/track` with the order number + email → tracker page works without login

---

## Project structure

```
src/
├── app/
│   ├── (public catalog)/      # /, /category/[slug], /product/[slug]
│   ├── search/                # full-text search results
│   ├── wishlist/              # localStorage-backed wishlist
│   ├── track/                 # public order tracking
│   ├── checkout/              # checkout form (Maps + coupon + shipping)
│   ├── order-success/         # post-payment confirmation
│   ├── account/               # customer area
│   ├── auth/                  # login, signup, oauth callback
│   ├── admin/                 # admin dashboard + CRUD
│   └── api/                   # checkout, verify-payment, coupon, track-order
├── components/
│   ├── AddressAutocomplete.tsx # Google Places input
│   ├── CheckoutClient.tsx      # checkout w/ live shipping + coupon
│   ├── CouponInput.tsx
│   ├── ProductGallery.tsx      # thumbnail switcher
│   ├── Toaster.tsx
│   ├── WishlistButton.tsx
│   └── ...
├── lib/
│   ├── supabase/              # browser, server, service-role clients
│   ├── shipping.ts            # Haversine + zone-based quoteShipping()
│   ├── google-maps.ts         # script loader
│   ├── coupons.ts             # server-side coupon validation
│   ├── cart-store.ts          # Zustand cart (localStorage persist)
│   ├── wishlist-store.ts      # Zustand wishlist
│   ├── toast-store.ts
│   ├── razorpay.ts
│   ├── email.ts               # Gmail SMTP
│   └── telegram.ts
└── types/db.ts
middleware.ts                   # auth + /admin guard
supabase/migrations/            # 00001_init.sql, 00002_features.sql
```

---

## Deploy

The easiest path is **Vercel**:

1. Push to a GitHub repo
2. Import into Vercel → set all env vars from `.env.local`
3. Update `NEXT_PUBLIC_SITE_URL` to your production URL
4. In **Razorpay** dashboard, switch to **Live Mode** and replace test keys
5. In **Google Cloud Console**, add your production URL to the Maps API key's HTTP referrers
6. In **Supabase Auth** settings, add your production URL to the allowed redirects

---

## Notes

- Cart + Wishlist are client-side only (localStorage). Order history syncs across devices for logged-in users.
- Prices, shipping, and coupon discount in `/api/checkout` are **always re-computed from the database** — clients cannot manipulate any of them.
- Razorpay signature is verified server-side with `crypto.timingSafeEqual` before any order is marked paid.
- Email and Telegram failures are logged but don't fail the order.
- Coupon `used_count` is only incremented after successful payment verification.
