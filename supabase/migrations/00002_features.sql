-- ============================================================================
-- 00002_features.sql — Wishlist-irrelevant DB changes:
--   * shipping location columns on orders
--   * discount / coupon columns on orders
--   * coupons table + RLS
-- Apply after 00001_init.sql.
-- ============================================================================

-- Extra order columns ------------------------------------------------------

alter table public.orders
  add column if not exists shipping_lat double precision,
  add column if not exists shipping_lng double precision,
  add column if not exists shipping_distance_km numeric(8, 2),
  add column if not exists shipping_zone text,
  add column if not exists discount_amount numeric(10, 2) not null default 0,
  add column if not exists coupon_code text;

-- Coupons ------------------------------------------------------------------

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent', 'flat')),
  value numeric(10, 2) not null check (value > 0),
  min_subtotal numeric(10, 2) not null default 0,
  max_discount numeric(10, 2),
  expires_at timestamptz,
  usage_limit int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Only admin can manage coupons; validation happens server-side via
-- service-role key, so no public-read policy is needed.
drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());
