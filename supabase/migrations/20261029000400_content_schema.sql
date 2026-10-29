-- Content schema: blog, pages, directory, events, videos, marketplace,
-- redirects and site settings. Every migrated table keeps a `wp_id` so the
-- import scripts (PR 5) can be re-run without creating duplicates.
--
-- RLS pattern: the public reads published rows, admins do everything.
-- Business owners can create and edit their own directory listing.

create type public.publish_status as enum ('draft', 'published');

-- Media rows also remember their WordPress attachment so content can be relinked.
alter table public.media add column wp_id bigint unique;

-- Every public content type has an `seo` column (replaces Yoast):
-- {"title", "description", "og_media_id", "canonical", "noindex"}, all optional.
-- Empty title/description fall back to the content's own title and excerpt.

-- ---------------------------------------------------------------- blog

create table public.post_categories (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.post_tags (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '', -- sanitised HTML
  featured_media_id uuid references public.media (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_published_idx on public.posts (status, published_at desc);
create index posts_featured_media_idx on public.posts (featured_media_id);
create index posts_author_idx on public.posts (author_id);

create table public.post_category_links (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.post_categories (id) on delete cascade,
  primary key (post_id, category_id)
);
create index post_category_links_category_idx on public.post_category_links (category_id);

create table public.post_tag_links (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.post_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index post_tag_links_tag_idx on public.post_tag_links (tag_id);

-- ---------------------------------------------------------------- pages

-- Free-form pages (privacy policy etc.). Pages with a custom layout (home,
-- directory, watch...) live in code and only use this table for SEO.
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  path text not null unique, -- e.g. 'privacy-policy', no slashes at the ends
  title text not null,
  content text not null default '',
  status public.publish_status not null default 'draft',
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- directory

-- The four filter steps: vehicle type, era, service and region.
create type public.directory_term_kind as enum ('vehicle', 'era', 'service', 'region');

create table public.directory_terms (
  id uuid primary key default gen_random_uuid(),
  kind public.directory_term_kind not null,
  slug text not null,
  label text not null,
  icon_media_id uuid references public.media (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, slug)
);
create index directory_terms_icon_idx on public.directory_terms (icon_media_id);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique, -- Formidable entry id
  owner_id uuid unique references public.profiles (id) on delete set null,
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  location text not null default '', -- town shown on cards
  address text not null default '',
  logo_media_id uuid references public.media (id) on delete set null,
  phone text not null default '',
  phone_2 text not null default '',
  email text not null default '',
  website text not null default '',
  -- {"mon": {"open": "08:00", "close": "16:00"}, ..., "sun": null}
  opening_hours jsonb not null default '{}'::jsonb,
  status public.publish_status not null default 'published',
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index businesses_status_name_idx on public.businesses (status, name);
create index businesses_logo_idx on public.businesses (logo_media_id);

create table public.business_terms (
  business_id uuid not null references public.businesses (id) on delete cascade,
  term_id uuid not null references public.directory_terms (id) on delete cascade,
  primary key (business_id, term_id)
);
create index business_terms_term_idx on public.business_terms (term_id);

-- ---------------------------------------------------------------- events

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique, -- Formidable entry id
  slug text not null unique,
  title text not null,
  organiser text not null default '',
  location text not null default '',
  description text not null default '',
  starts_on date not null,
  ends_on date,
  start_time time,
  end_time time,
  poster_media_id uuid references public.media (id) on delete set null,
  facebook_url text not null default '', -- tickets and details link out here
  contact_email text not null default '',
  status public.publish_status not null default 'published',
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
create index events_status_starts_idx on public.events (status, starts_on);
create index events_poster_idx on public.events (poster_media_id);

-- ---------------------------------------------------------------- watch

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique,
  title text not null,
  description text not null default '',
  published_at timestamptz, -- YouTube publish date, used for ordering
  sort_order integer not null default 0,
  status public.publish_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index videos_status_published_idx on public.videos (status, published_at desc);

-- ---------------------------------------------------------------- marketplace

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique,
  slug text not null unique,
  title text not null,
  price text not null default '', -- free text on the live site ("€12,500", "POA")
  listing_status text not null default 'For Sale',
  status_color text not null default '',
  body_type text not null default '',
  year text not null default '',
  -- mileage, engine_size, fuel, transmission, doors, seats, mpg, owners, local,
  -- each {"value": "...", "show": true}
  details jsonb not null default '{}'::jsonb,
  content text not null default '',
  image_media_id uuid references public.media (id) on delete set null,
  external_url text not null default '',
  listed_on date,
  status public.publish_status not null default 'published',
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_status_idx on public.vehicles (status, listed_on desc);
create index vehicles_image_idx on public.vehicles (image_media_id);

create table public.vehicle_media (
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (vehicle_id, media_id)
);
create index vehicle_media_media_idx on public.vehicle_media (media_id);

-- ---------------------------------------------------------------- site

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  source text not null unique, -- path with leading and trailing slash
  destination text not null,
  permanent boolean not null default true,
  hits integer not null default 0,
  created_at timestamptz not null default now()
);

-- Key/value site settings (social links, shop shipping, newsletter...).
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- triggers

create trigger posts_touch_updated_at before update on public.posts
  for each row execute function private.touch_updated_at();
create trigger pages_touch_updated_at before update on public.pages
  for each row execute function private.touch_updated_at();
create trigger businesses_touch_updated_at before update on public.businesses
  for each row execute function private.touch_updated_at();
create trigger events_touch_updated_at before update on public.events
  for each row execute function private.touch_updated_at();
create trigger videos_touch_updated_at before update on public.videos
  for each row execute function private.touch_updated_at();
create trigger vehicles_touch_updated_at before update on public.vehicles
  for each row execute function private.touch_updated_at();
create trigger settings_touch_updated_at before update on public.settings
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- RLS

alter table public.post_categories enable row level security;
alter table public.post_tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_category_links enable row level security;
alter table public.post_tag_links enable row level security;
alter table public.pages enable row level security;
alter table public.directory_terms enable row level security;
alter table public.businesses enable row level security;
alter table public.business_terms enable row level security;
alter table public.events enable row level security;
alter table public.videos enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_media enable row level security;
alter table public.redirects enable row level security;
alter table public.settings enable row level security;

-- Lookup tables: public read, admin write.
do $$
declare t text;
begin
  foreach t in array array[
    'post_categories', 'post_tags', 'post_category_links', 'post_tag_links',
    'directory_terms', 'vehicle_media', 'redirects', 'settings'
  ] loop
    execute format('create policy "Anyone can read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "Admins can manage" on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  end loop;
end $$;

-- Content tables: the public sees published rows; admins see and manage all.
do $$
declare t text;
begin
  foreach t in array array['posts', 'pages', 'events', 'videos', 'vehicles'] loop
    execute format($p$create policy "Published rows are public" on public.%I for select to anon, authenticated using (status = 'published' or (select private.is_admin()))$p$, t);
    execute format('create policy "Admins can insert" on public.%I for insert to authenticated with check ((select private.is_admin()))', t);
    execute format('create policy "Admins can update" on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format('create policy "Admins can delete" on public.%I for delete to authenticated using ((select private.is_admin()))', t);
  end loop;
end $$;

-- Businesses: published listings are public; owners manage their own listing
-- (it goes live straight away); admins manage all.
create policy "Published or own listings are visible"
  on public.businesses for select
  to anon, authenticated
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Owners create their listing"
  on public.businesses for insert
  to authenticated
  with check (
    (owner_id = (select auth.uid()) and (select private.user_role()) = 'business_owner')
    or (select private.is_admin())
  );

create policy "Owners edit their listing"
  on public.businesses for update
  to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "Admins delete listings"
  on public.businesses for delete
  to authenticated
  using ((select private.is_admin()));

-- Owners can change their listing's content but not its owner, slug, status or ids.
revoke update on public.businesses from authenticated;
grant update (
  name, short_description, description, location, address, logo_media_id,
  phone, phone_2, email, website, opening_hours, seo
) on public.businesses to authenticated;

-- Admin writes to the restricted columns go through this function.
create function public.admin_update_business(
  target uuid,
  new_slug text,
  new_status public.publish_status,
  new_owner uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only admins can change this' using errcode = '42501';
  end if;
  update public.businesses
    set slug = new_slug, status = new_status, owner_id = new_owner
    where id = target;
end;
$$;
revoke execute on function public.admin_update_business(uuid, text, public.publish_status, uuid) from public, anon;
grant execute on function public.admin_update_business(uuid, text, public.publish_status, uuid) to authenticated;

create policy "Terms of visible listings are public"
  on public.business_terms for select
  to anon, authenticated
  using (true);

create policy "Owners and admins manage listing terms"
  on public.business_terms for all
  to authenticated
  using (
    (select private.is_admin())
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  )
  with check (
    (select private.is_admin())
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

-- Business owners upload their logo into media/business/<their user id>/.
create policy "Business owners upload their logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'business'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "Business owners record their logo"
  on public.media for insert
  to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and path like 'business/' || (select auth.uid())::text || '/%'
  );
