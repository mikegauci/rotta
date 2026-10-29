-- Media library: files live in the public `media` storage bucket, and each
-- file has a row in public.media with its alt text and dimensions.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  20971520, -- 20 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'video/mp4', 'application/pdf']
);

create policy "Admins can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (select private.is_admin()));

create policy "Admins can update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

create policy "Admins can delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width integer,
  height integer,
  alt text not null default '',
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index media_created_at_idx on public.media (created_at desc);
create index media_uploaded_by_idx on public.media (uploaded_by);

alter table public.media enable row level security;

create policy "Anyone can read media"
  on public.media for select
  to anon, authenticated
  using (true);

create policy "Admins can add media"
  on public.media for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can edit media"
  on public.media for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete media"
  on public.media for delete
  to authenticated
  using ((select private.is_admin()));
