-- Watch page: videos are grouped into series (Rotta Stories, Nostalgia...),
-- shown as one carousel per series in admin-defined order.

create table public.video_series (
  id uuid primary key default gen_random_uuid(),
  wp_id bigint unique, -- Slide Anything slider id
  slug text not null unique,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.videos
  add column series_id uuid references public.video_series (id) on delete set null;
create index videos_series_idx on public.videos (series_id, sort_order);

alter table public.video_series enable row level security;

create policy "Anyone can read" on public.video_series
  for select to anon, authenticated using (true);
create policy "Admins can insert" on public.video_series
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update" on public.video_series
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins can delete" on public.video_series
  for delete to authenticated using ((select private.is_admin()));
