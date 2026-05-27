-- ============================================================================
-- Radharani Collection — Initial schema, RLS, seeds
-- Paste this into the Supabase SQL editor and run.
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  images text[] not null default '{}',
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);

-- ---------------------------------------------------------------------------
-- Product Variations
-- ---------------------------------------------------------------------------
create table if not exists public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  attributes jsonb not null default '{}',
  price numeric(10,2) not null check (price >= 0),
  stock int not null default 0,
  sku text,
  created_at timestamptz not null default now()
);

create index if not exists variations_product_idx on public.product_variations(product_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_created_idx on public.orders(created_at desc);

-- ---------------------------------------------------------------------------
-- Order Items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variation_id uuid references public.product_variations(id) on delete set null,
  product_name text not null,
  variation_name text,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(10,2) not null
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------------
-- Helper: is_admin()
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories (public read; admin write) -------------------------------------
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products ------------------------------------------------------------------
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_active or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- variations ----------------------------------------------------------------
drop policy if exists "variations_public_read" on public.product_variations;
create policy "variations_public_read" on public.product_variations
  for select using (true);

drop policy if exists "variations_admin_write" on public.product_variations;
create policy "variations_admin_write" on public.product_variations
  for all using (public.is_admin()) with check (public.is_admin());

-- orders (users see own; admin sees all; writes via service role) -----------
drop policy if exists "orders_own_read" on public.orders;
create policy "orders_own_read" on public.orders
  for select using (
    (user_id is not null and auth.uid() = user_id) or public.is_admin()
  );

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items: read along with order
drop policy if exists "order_items_own_read" on public.order_items;
create policy "order_items_own_read" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and ((o.user_id is not null and auth.uid() = o.user_id) or public.is_admin())
    )
  );

-- ===========================================================================
-- STORAGE BUCKET for product images
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ===========================================================================
-- SEED CATEGORIES
-- ===========================================================================

insert into public.categories (slug, name, sort_order) values
  ('men',         'Men',         1),
  ('women',       'Women',       2),
  ('kids',        'Kids',        3),
  ('accessories', 'Accessories', 4)
on conflict (slug) do nothing;
