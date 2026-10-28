# Rotta — rotta.mt rebuild

Rebuild of rotta.mt (Malta automotive community site) from WordPress to **Next.js + Supabase on Vercel**, with a custom in-house CMS. WordPress is retired after launch.

## Ground rules

- **Exact 1:1 design and content** with the live site. When in doubt, compare against https://rotta.mt.
- English only.
- **Never point rotta.mt DNS (Cloudflare) at Vercel without explicit go-ahead from Mike.** Until then everything runs on Vercel preview URLs.
- Never commit secrets or anything in `migration/exports/` (DB dump, uploads). Both are gitignored.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router), TypeScript, Tailwind, shadcn/ui |
| Hosting | Vercel — team "mikegauci's projects" |
| DB / Auth / Storage | Supabase project `rotta` (ref `wdctbixfjvwbvqlylpuf`, eu-west-1) |
| Payments | Stripe — **same Stripe account as the current WooCommerce store** |
| Email | Resend (orders, directory/contact notifications) |
| Rich text | Tiptap |
| Analytics | GA4 `G-Y1D8J24FMB` |
| Repo | github.com/mikegauci/rotta |

Rendering: public content pages are statically generated / ISR and revalidated from the CMS; cart, checkout, My Business and `/admin` are dynamic.

## Current site (source of truth for migration)

WordPress + Astra (child theme) + Getwid blocks.

| Section | WP implementation | Volume | Notes |
|---|---|---|---|
| Blog | Posts | 15 posts, 3 categories, 26 tags | |
| Directory | **Formidable Forms** entries + Views | ~150 businesses | Step-by-step filter: I drive… → Vehicle era → Parts/Service → Region |
| My Business | Formidable form + login/reset-password pages | | Owners add/edit their own listing |
| Events | **Formidable Forms** entries + calendar/carousel Views | ~220 | |
| Watch | YouTube (channel `UCnAE_OMHV3VxcbrXq4_v-7g`) | 116 videos | MP4 background videos on home + watch |
| Marketplace | WP pages | 3 vehicles | "Contact us to list" |
| Shop | WooCommerce + woo-fly-cart, variation swatches, grouped products; Stripe | 18 products (many variable) | |
| Other | Contact Form 7, Redirection, Yoast, Instagram feed | | |

Drop these junk pages: `/test/`, `/test34rt/`, `/slide-anything-popup-preview/`.

## Product decisions

- **Marketplace**: keep the pages but hide it from the homepage and the main menu (URL still works, noindex is fine).
- **Directory**: submissions go **live immediately** (no approval); admins can unpublish. Keep the 4-step filter; filter taxonomies are admin-managed lists.
- **Roles**: `admin` (full CMS) and `business_owner` (can only manage their own listing, enforced with RLS). First admin: mikegauci@gmail.com, username `admin`.
- **Events**: created by admins only. Ticketed events link out to Facebook, no ticketing system.
- **Watch**: videos are picked and ordered by admins (not an auto-sync).
- **Shop**: physical products only; Malta + Gozo shipping only; prices include Malta VAT 18%. No PayPal. Migrate products, customers and order history from WooCommerce.
- **Accounts**: migrated users (customers + business owners) set a new password via magic link on first login; WP password hashes are not reused.
- **SEO**: in-house SEO fields (title, description, OG image, canonical, noindex) on every content type, replacing Yoast. Keep URLs identical; 301 anything that changes (import the Redirection plugin rules).
- **Skipped**: Instagram feed. Newsletter ("Don't miss out") is last priority.

## Migration inputs

Put these in `migration/exports/` without unzipping (UpdraftPlus format): `*_db.gz`, every `*_uploads*.zip`, `*_themes.zip`. The DB dump is the source for posts, Formidable entries, WooCommerce data, users, Yoast meta and redirects. Uploads go to Supabase Storage, and old `wp-content/uploads` URLs get rewritten.

## PR plan

Each PR is small and reviewable. Pages that need data are built against seed data first, and real data arrives with PR 5.

1. **Foundation**: Next.js scaffold, Tailwind, lint/format, Supabase clients (server/browser), env setup, Vercel project + preview deploys.
2. **Design system and layout**: fonts, colours and spacing copied from the live CSS; header (Marketplace hidden), cart icon, footer, mobile menu.
3. **Auth and roles**: Supabase Auth, login/register/reset (magic link), `profiles` with roles, RLS baseline, seed the first admin.
4. **Schema**: posts, taxonomies, businesses, events, videos, marketplace vehicles, products/variants, orders, customers, pages, media, seo, redirects.
5. **Migration scripts**: DB dump → Supabase, uploads → Storage, URL rewrites, redirect map. Re-runnable for the final sync.
6. **Admin CMS shell**: `/admin` layout, media library, SEO panel, user management.
7. **Blog**: listing, post, category and tag pages, plus the admin editor.
8. **Directory**: filter flow, search results, detail pages, My Business form and owner dashboard.
9. **Events**: calendar, carousel, detail pages, admin editor.
10. **Watch and Marketplace**: admin-curated videos, marketplace pages (unlinked).
11. **Shop**: product and variation pages, fly-out cart, Stripe Checkout and webhooks, shipping and VAT, order emails, order admin.
12. **Homepage and static pages**: homepage 1:1 (hero MP4), contact form + email, privacy policy.
13. **SEO and QA**: sitemaps, metadata, GA4, redirects, visual parity check against the live site.
14. **Go-live**: final data sync and the Cloudflare DNS switch. **Only after Mike's go-ahead.**

## Status

- [ ] Exports received
- [ ] PR 1 Foundation
