-- Marketplace vehicles were hand-built WordPress pages. These columns hold
-- the parts of that layout so the page can be rendered from a template:
--   content        the "Description" text (plain, line breaks kept)
--   card_title     the shorter name on the listing card ("Buick Skylark")
--   condition      "Excellent", "Like new"...
--   seller_details the "Seller Details" box, one line per row (first in bold)
--   cta_media_id   background of the "Have a car worth listing?" band
--   details        the feature icons, {"<key>": {"value": "...", "show": true}}
alter table public.vehicles
  add column card_title text not null default '',
  add column condition text not null default '',
  add column seller_details text not null default '',
  add column cta_media_id uuid references public.media (id) on delete set null;
create index vehicles_cta_media_idx on public.vehicles (cta_media_id);
