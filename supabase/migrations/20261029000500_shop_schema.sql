-- Shop schema: products with option-based variants, customer addresses and
-- orders. Money is stored in euro cents. Prices include Malta VAT (18%), so
-- `vat_cents` on an order is the VAT portion already inside the total.
--
-- Orders are written only by the server (Stripe webhook, with the secret key),
-- never by the browser, so there are no insert policies for customers.

create type public.stock_status as enum ('in_stock', 'out_of_stock', 'on_backorder');
create type public.order_status as enum (
  'pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'
);

-- ---------------------------------------------------------------- catalogue

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_categories_image_idx on public.product_categories (image_media_id);

create table public.product_tags (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  sku text unique,
  -- Simple products use these directly; variable products show the range of
  -- their variants and these act as the default.
  price_cents integer check (price_cents >= 0),
  sale_price_cents integer check (sale_price_cents >= 0),
  manage_stock boolean not null default false,
  stock_quantity integer,
  stock_status public.stock_status not null default 'in_stock',
  -- Variant options in display order: [{"name": "Size", "values": ["S", "M"]}]
  options jsonb not null default '[]'::jsonb,
  featured_media_id uuid references public.media (id) on delete set null,
  status public.publish_status not null default 'draft',
  sort_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products (status, sort_order);
create index products_featured_media_idx on public.products (featured_media_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  product_id uuid not null references public.products (id) on delete cascade,
  -- {"Size": "M", "Colour": "Black"}
  option_values jsonb not null default '{}'::jsonb,
  sku text unique,
  price_cents integer not null check (price_cents >= 0),
  sale_price_cents integer check (sale_price_cents >= 0),
  manage_stock boolean not null default false,
  stock_quantity integer,
  stock_status public.stock_status not null default 'in_stock',
  image_media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, option_values)
);
create index product_variants_image_idx on public.product_variants (image_media_id);

create table public.product_media (
  product_id uuid not null references public.products (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, media_id)
);
create index product_media_media_idx on public.product_media (media_id);

create table public.product_category_links (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.product_categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_category_links_category_idx on public.product_category_links (category_id);

create table public.product_tag_links (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id uuid not null references public.product_tags (id) on delete cascade,
  primary key (product_id, tag_id)
);
create index product_tag_links_tag_idx on public.product_tag_links (tag_id);

-- ---------------------------------------------------------------- customers

-- Address shape: {"first_name", "last_name", "company", "address_1",
-- "address_2", "city", "postcode", "country", "phone"}
alter table public.profiles
  add column wp_id bigint unique,
  add column billing_address jsonb not null default '{}'::jsonb,
  add column shipping_address jsonb not null default '{}'::jsonb,
  add column stripe_customer_id text unique;

-- Users may edit their own addresses (alongside username and full name).
grant update (billing_address, shipping_address) on public.profiles to authenticated;

-- ---------------------------------------------------------------- orders

create sequence public.order_number_seq start 10000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  -- Shown to customers. Migrated orders keep their WooCommerce number.
  number bigint not null unique default nextval('public.order_number_seq'),
  customer_id uuid references public.profiles (id) on delete set null,
  email text not null,
  status public.order_status not null default 'pending',
  currency text not null default 'EUR',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  shipping_cents integer not null default 0,
  vat_cents integer not null default 0,
  total_cents integer not null default 0,
  billing_address jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  shipping_method text not null default '',
  payment_method text not null default '', -- 'stripe', or 'paypal' on old orders
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  customer_note text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter sequence public.order_number_seq owned by public.orders.number;
create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  -- Snapshot at purchase time, so old orders survive product edits.
  name text not null,
  option_values jsonb not null default '{}'::jsonb,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  total_cents integer not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_variant_idx on public.order_items (variant_id);

create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  body text not null,
  customer_visible boolean not null default false,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_notes_order_idx on public.order_notes (order_id, created_at);
create index order_notes_author_idx on public.order_notes (author_id);

-- ---------------------------------------------------------------- triggers

create trigger products_touch_updated_at before update on public.products
  for each row execute function private.touch_updated_at();
create trigger product_variants_touch_updated_at before update on public.product_variants
  for each row execute function private.touch_updated_at();
create trigger orders_touch_updated_at before update on public.orders
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- RLS

alter table public.product_categories enable row level security;
alter table public.product_tags enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.product_category_links enable row level security;
alter table public.product_tag_links enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_notes enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'product_categories', 'product_tags', 'product_variants', 'product_media',
    'product_category_links', 'product_tag_links'
  ] loop
    execute format('create policy "Anyone can read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "Admins can manage" on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  end loop;
end $$;

create policy "Published products are public"
  on public.products for select
  to anon, authenticated
  using (status = 'published' or (select private.is_admin()));
create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Customers see their own orders; admins see and manage all of them.
create policy "Customers read their orders"
  on public.orders for select
  to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));
create policy "Admins manage orders"
  on public.orders for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Customers read their order items"
  on public.order_items for select
  to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  );
create policy "Admins manage order items"
  on public.order_items for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Customers read visible notes on their orders"
  on public.order_notes for select
  to authenticated
  using (
    (select private.is_admin())
    or (
      customer_visible
      and exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
    )
  );
create policy "Admins manage order notes"
  on public.order_notes for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Shop settings: free delivery to Malta and Gozo, prices include 18% VAT.
insert into public.settings (key, value) values
  ('shop', '{"vat_rate": 0.18, "prices_include_vat": true, "shipping": [{"id": "malta-free", "label": "Malta & Gozo - Free Delivery", "countries": ["MT"], "price_cents": 0}]}');
