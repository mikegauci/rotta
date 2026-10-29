-- Watch page: each series has a title image (the live site uses artwork, not
-- text) and a one-line description under it.
alter table public.video_series
  add column description text not null default '',
  add column title_media_id uuid references public.media (id) on delete set null;
create index video_series_title_media_idx on public.video_series (title_media_id);
