-- Live URLs with no equivalent on the new site (found by checking every URL
-- in the Yoast sitemaps). The junk pages /test/, /test34rt/ and
-- /slide-anything-popup-preview/ are dropped and return 404.
insert into public.redirects (source, destination, permanent) values
  -- Hand-built 2021 prototype listing (placeholder text, not in search).
  ('/directory/gordons-moto-center-ltd/', '/directory/', true),
  -- Untitled Formidable page with no entry.
  ('/directory/47702-2/', '/directory/', true),
  -- Digital product, drafted under the physical-products-only decision.
  ('/product/buy-a-photo/', '/shop/', true),
  -- Never listed on /marketplace/ and errors on the live site.
  ('/marketplace/alfa-romeo-gtam-19/', '/marketplace/', true)
on conflict (source) do nothing;
