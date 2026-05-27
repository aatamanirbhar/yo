-- ============================================================================
-- 00003_cart_sync.sql — Per-user cart so the cart follows the customer
--                       across devices and survives logout/login.
-- Apply AFTER 00001_init.sql and 00002_features.sql.
-- ============================================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variation_id uuid references public.product_variations(id) on delete set null,
  quantity int not null check (quantity > 0 and quantity <= 99),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_user_idx
  on public.cart_items(user_id);

-- Unique per (user, product, variation). variation_id can be NULL so we need
-- two partial indexes (Postgres treats NULLs as distinct in normal unique
-- constraints).
drop index if exists cart_items_user_product_variation_uq;
create unique index cart_items_user_product_variation_uq
  on public.cart_items(user_id, product_id, variation_id)
  where variation_id is not null;

drop index if exists cart_items_user_product_no_variation_uq;
create unique index cart_items_user_product_no_variation_uq
  on public.cart_items(user_id, product_id)
  where variation_id is null;

-- RLS: users only see and write their own cart.
alter table public.cart_items enable row level security;

drop policy if exists "cart_items_self" on public.cart_items;
create policy "cart_items_self" on public.cart_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
