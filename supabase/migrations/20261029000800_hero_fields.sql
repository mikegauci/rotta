-- Hero banners: posts have a subtitle and their own hero image (separate
-- from the card thumbnail), and pages can set a hero image for layouts
-- built in code (blog, directory, watch...).
alter table public.posts
  add column subtitle text not null default '',
  add column hero_media_id uuid references public.media (id) on delete set null;
create index posts_hero_media_idx on public.posts (hero_media_id);

alter table public.pages
  add column hero_media_id uuid references public.media (id) on delete set null;
create index pages_hero_media_idx on public.pages (hero_media_id);
