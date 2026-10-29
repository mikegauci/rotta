# Rotta — rotta.mt rebuild

Rebuild of rotta.mt (Malta automotive community site) from WordPress to **Next.js + Supabase on Vercel**, with a custom in-house CMS. WordPress is retired after launch.

## Ground rules

- **Exact 1:1 design and content** with the live site. When in doubt, compare against https://rotta.mt.
- English only.
- **Never point rotta.mt DNS (Cloudflare) at Vercel without explicit go-ahead from Mike.** The Vercel production alias is used for integration checks while rotta.mt still serves WordPress.
- Never commit secrets or anything in `migration/exports/` (DB dump, uploads). Both are gitignored.

## Stack

| Layer               | Choice                                                            |
| ------------------- | ----------------------------------------------------------------- |
| App                 | Next.js (App Router), TypeScript, Tailwind, shadcn/ui             |
| Hosting             | Vercel — team "mikegauci's projects"                              |
| DB / Auth / Storage | Supabase project `rotta` (ref `wdctbixfjvwbvqlylpuf`, eu-west-1)  |
| Payments            | Stripe — **same Stripe account as the current WooCommerce store** |
| Email               | Resend (orders, directory/contact notifications)                  |
| Rich text           | Tiptap                                                            |
| Analytics           | GA4 `G-Y1D8J24FMB`                                                |
| Repo                | github.com/mikegauci/rotta                                        |

Rendering: public content pages are statically generated / ISR and revalidated from the CMS; cart, checkout, My Business and `/admin` are dynamic.

## Current site (source of truth for migration)

WordPress + Astra (child theme) + Getwid blocks.

| Section     | WP implementation                                                        | Volume                          | Notes                                                                |
| ----------- | ------------------------------------------------------------------------ | ------------------------------- | -------------------------------------------------------------------- |
| Blog        | Posts                                                                    | 15 posts, 3 categories, 26 tags |                                                                      |
| Directory   | **Formidable Forms** entries + Views                                     | ~150 businesses                 | Step-by-step filter: I drive… → Vehicle era → Parts/Service → Region |
| My Business | Formidable form + login/reset-password pages                             |                                 | Owners add/edit their own listing                                    |
| Events      | **Formidable Forms** entries + calendar/carousel Views                   | ~220                            |                                                                      |
| Watch       | YouTube (channel `UCnAE_OMHV3VxcbrXq4_v-7g`)                             | 116 videos                      | MP4 background videos on home + watch                                |
| Marketplace | WP pages                                                                 | 3 vehicles                      | "Contact us to list"                                                 |
| Shop        | WooCommerce + woo-fly-cart, variation swatches, grouped products; Stripe | 18 products (many variable)     |                                                                      |
| Other       | Contact Form 7, Redirection, Yoast, Instagram feed                       |                                 |                                                                      |

Drop these junk pages: `/test/`, `/test34rt/`, `/slide-anything-popup-preview/`.

## Commands

```bash
pnpm dev           # local dev server
pnpm build         # production build (stop `pnpm dev` first: both write to .next)
pnpm lint          # eslint
pnpm typecheck     # next typegen + tsc
pnpm format        # prettier (with Tailwind class sorting)
```

## Conventions

- Next.js 16: middleware is `src/proxy.ts`; `cacheComponents` is on. Read `node_modules/next/dist/docs/` before using unfamiliar APIs (see AGENTS.md).
- Supabase clients: `@/lib/supabase/server` (Server Components, Route Handlers, Server Actions), `@/lib/supabase/client` (Client Components). Env is read through `@/lib/env`.
- DB changes are SQL files in `supabase/migrations/` (timestamped), applied with the Supabase connector. No Supabase CLI dependency.
- Route groups pick the header: `src/app/(hero)/` = transparent header over a hero (home, directory, directory search, watch, marketplace, contact, my-business, login); `src/app/(plain)/` = solid white header (events, shop, cart, checkout, posts, directory detail, legal). Both use `SiteShell`.
- Design tokens live in `src/app/globals.css` (`brand` #f1be58, `ink` #191919, `body` #3a3a3a...). Use them instead of raw hex values. Desktop breakpoint is 922px (Astra's): use the `desk:` variant, not `min-[922px]:` (arbitrary px variants sort before `sm`/`md`).
- `<NewsletterSignup />` is opt-in per page (home, directory, directory detail, watch, blog, contact).
- Auth: `getCurrentUser()` / `requireUser()` / `requireRole()` in `@/lib/auth/session` (server-only). Anything that reads the session must sit inside `<Suspense>`, and routes that gate on it set `export const instant = false`. Form actions are in `@/lib/auth/actions`.
- Roles are in `profiles.role` (`admin`, `business_owner`, `customer`). Users can never change their own role; only `public.set_user_role()` (admin-checked) can. Registration creates `business_owner` accounts; shop checkout will create `customer` accounts.
- Admin: everything under `src/app/(admin)/admin/` is gated by the layout, and every Server Action calls `assertAdmin()` from `@/lib/auth/admin` itself. Enable a section in `src/components/admin/sidebar.tsx` when it ships.
- Media: files go to the public `media` Storage bucket (admin-only writes via RLS) with a row in `public.media`. Use `mediaUrl(path)` from `@/lib/media`.
- Forms with `useActionState`: React resets the form after an action, so return the submitted values in `fields` and pass them as `defaultValue`.
- `trailingSlash: true` keeps WordPress-style URLs. Always write internal links with a trailing slash.
- Email: `sendEmail()` from `@/lib/email/send` (server-only) sends through Resend with the shared Rotta layout (heading, paragraphs, label/value rows, button). Without `RESEND_API_KEY` it logs instead of sending. Sender domain `rotta.mt` is verified in Resend (records on `send.rotta.mt` and `resend._domainkey`). Supabase Auth emails go through Resend SMTP, configured in the Supabase dashboard. Don't add a strict DMARC policy: Google Workspace mail on the root domain has no SPF/DKIM.
- Schema: every migrated table has a `wp_id` (WordPress/Formidable id) so imports can be re-run. Public content has `status` (`draft`/`published`) and an `seo` jsonb (`title`, `description`, `og_media_id`, `canonical`, `noindex`). Money is integer euro cents; prices include 18% VAT, and `orders.vat_cents` is the VAT inside the total. Shop config lives in `settings` (key `shop`).
- Directory listings: one per owner (`businesses.owner_id` is unique). Owners can only update content columns (column grants); slug, status and owner change through `admin_update_business()`. Owners upload logos to `media/business/<user id>/`.
- `createAdminClient()` bypasses RLS: use it only in server code acting for the site, and validate every input first. Needs `SUPABASE_SECRET_KEY` (also on Vercel).
- Orders are written only by the server (Stripe webhook with the secret key); customers can read their own orders.
- Migration storage budget: stay under Supabase's 1 GB free storage. Import only files the DB references (no WP size variants or plugin backup folders), converted to WebP (q75, max 2000px).
- Import: `pnpm migrate` (dry run, report in `migration/.cache/report.md`) and `pnpm migrate --apply` (needs `SUPABASE_SECRET_KEY` in `.env`/`.env.local`). Re-runnable: rows and media get stable ids from their WordPress ids, so it updates in place. After the final sync, run `select setval('public.order_number_seq', greatest((select max(number) from public.orders) + 1, 50000), false);` so new orders continue after the WooCommerce numbers.
- Imported content: post/page HTML has block comments removed, uploads rewritten to Storage URLs and rotta.mt links made relative. The hero section at the top of each post/page is lifted out into `subtitle` + `hero_media_id`.
- Public data: read through `publicDb` (`@/lib/supabase/public`, cookie-less, anonymous) inside `"use cache"` functions tagged by type (`posts`, `pages`...); admin saves call `revalidateTag`. Blog data lives in `@/lib/blog`. Pages that await `params` do it inside `<Suspense>`.
- Blog URLs match WordPress: posts at `/<slug>/` (`(plain)/[slug]`), `/category/<slug>/`, `/tag/<slug>/`, `/author/<username>/`, each with `/page/N/` (10 per page). `PageHero` is the shared Spectra-style hero.
- Rich text: `RichTextEditor` (`@/components/admin/rich-text-editor`) is Tiptap for new content. Imported HTML with WordPress layouts (divs, figures, classes) opens in HTML mode with a live preview, so Tiptap never flattens galleries or columns. Images come from `MediaPicker`/`MediaField` (`@/components/admin/media-picker`); browser uploads go through `uploadFiles()` in `@/lib/media-upload`.
- Posts share the root URL space: `RESERVED_SLUGS` in `@/lib/slug` lists the first path segments taken by code routes. Renaming a published post's slug adds a 301 to `redirects`. Drafts can be previewed by admins at `/preview/<post id>/`.
- Directory data lives in `@/lib/directory` (`getDirectory()` is cached under the `directory` tag; listing pages also use `business:<slug>`). URLs match WordPress: `/directory/`, `/directory/search-results/?vehicles=&era=&services=&region=` (term labels, matched by slug; `region=All` means no filter; `frm_search` is the keyword) and `/directory/<slug>/`. Design images for these pages are in `public/directory/`.
- Listing writes: `cleanBusiness()` (`@/lib/business-input`) validates both forms; `insertListing()`/`replaceTerms()`/`refreshDirectory()` live in `@/lib/directory-write`. Owners save through `saveMyListing` (logos are shrunk to WebP in the browser and uploaded to `media/business/<uid>/`); admins through `adminSaveListing`, which renames via `admin_update_business()` and adds a 301 for the old address. New owner listings email `EMAIL_ADMIN_TO`.
- Events data lives in `@/lib/events` (cached under `events` and `event:<slug>`). URLs match WordPress: `/events/`, `/events/?frmcal-month=MM&frmcal-year=YYYY` for the calendar, `/events/<slug>/`. "Upcoming" uses today in Europe/Malta, so that part of the page renders per request. "Previous Events" are three hand-picked shop products (`PREVIOUS_EVENT_PRODUCTS`). The public "Add Event" form (`submitEvent`) writes with the secret key through `createAdminClient()` (`@/lib/supabase/admin`), re-encodes posters with sharp to WebP (max 2000px) under `media/events/`, and uses a honeypot plus a minimum fill time against bots.
- Watch data lives in `@/lib/watch` (cached under `videos`): each `video_series` is one carousel on `/watch/` (title artwork in `title_media_id`, a description, admin order), with its published `videos` in `sort_order`. Thumbnails come from `img.youtube.com`; the play button opens a youtube-nocookie lightbox. Admins add videos by pasting a YouTube link at `/admin/videos/` (the title comes from YouTube oEmbed). The hero MP4 is in Storage at `wp/2021/01/rotta-video-bg.mp4`.
- Marketplace data lives in `@/lib/marketplace` (cached under `vehicles` and `vehicle:<slug>`). The old hand-built WordPress pages became a template: `content` is the description, `details` holds the feature icons (`@/lib/vehicle-features`, SVGs in `public/marketplace/icons/`), `seller_details` is one line per row, photos are `vehicle_media`. Every marketplace page is noindex.
- SEO: build page metadata with `pageMetadata()` / `codePageMetadata()` from `@/lib/seo` (canonical, Open Graph, Twitter card, noindex). `seo.title` is the **full** browser title (Yoast parity, e.g. "Watch - Rotta | Sharing a Passion"); without it the title is "<name> - Rotta". Code pages (home, watch, shop...) take their SEO from the `pages` row with the same path. Missing slugs return `notFoundMetadata`.
- Indexing and analytics follow `NEXT_PUBLIC_SITE_URL`: only when its host is `rotta.mt` (`isLiveSite`) does `robots.txt` allow crawling and GA4 `G-Y1D8J24FMB` load. Previews and the Vercel alias are `Disallow: /`. `src/app/sitemap.ts` replaces Yoast's sitemaps.
- Redirects: `src/proxy.ts` serves the `redirects` table (cached 60s per instance; CMS renames add rows) plus fixed rules for retired WordPress URLs in `@/lib/redirects` (Yoast sitemaps → `/sitemap.xml`, `/product-category/` and `/product-tag/` → `/shop/`, `/frm_display/` → `/`, `/feed/` → `/blog/`, `/wp-admin` → `/login/`). Old `/wp-content/uploads/...` links 301 to the migrated Storage file (WebP, size variants mapped to the original) via `src/app/wp-content/uploads/[...path]/route.ts`.
- `<GetInTouch />` (`@/components/get-in-touch`) emails `EMAIL_ADMIN_TO` through `sendContactMessage`.
- Marketplace is excluded from `primaryNav` (header and footer menus).
- One PR per plan item, branch `pr/NN-name`, squash-merged with auto-merge on. Follow-up work for a merged item gets a new branch/PR; do not rewrite its merged history.

## Product decisions

- **Marketplace**: keep the pages but hide it from the homepage and the main menu (URL still works, noindex is fine).
- **Directory**: submissions go **live immediately** (no approval); admins can unpublish. Keep the 4-step filter; filter taxonomies are admin-managed lists.
- **Roles**: `admin` (full CMS) and `business_owner` (can only manage their own listing, enforced with RLS). First admin: mikegauci@gmail.com, username `admin`.
- **Events**: as on the live site, anyone can submit an event with the public "Add Event" form on `/events/`; it goes live straight away, the admin gets an email, and admins can edit or unpublish it. Ticketed events link out to Facebook, no ticketing system.
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

## Status and handoff (2026-10-29)

- [x] Exports received (live rotta.mt DB dump, uploads.zip, astra-child.zip)
- [x] PR 1 Foundation; PR 2 Design system; PR 2b Email; PR 3 Auth and roles; PR 4 Schema; PR 5 Migration and first import; PR 6 Admin CMS
- [x] PR 7 Blog and PR 7b Blog admin; PR 8 Directory and My Business; PR 9 Events; PR 10 Watch and Marketplace
- [x] PR 11 shop **code merged** as [#17](https://github.com/mikegauci/rotta/pull/17), but payment acceptance and hardening remain open. `SHOP_CHECKOUT_ENABLED=false` is the server-side gate; do not mark the shop production-ready.
- [x] PR 12 Homepage and static pages merged as [#18](https://github.com/mikegauci/rotta/pull/18).
- [x] PR 13 SEO and QA (see below)
- [x] Shop payment hardening and test-mode acceptance (PR 15; see "Still open" below)
- [ ] PR 14 Final sync and go-live, including Cloudflare DNS switch **only with Mike's explicit go-ahead**

Start new work from a freshly fetched `origin/main` on a new `pr/NN-name` branch, then check `git status` and current PR state. Never commit `.env`, `.env.local`, `migration/exports/`, or secret values.

### Shop and Stripe: implemented state

PR #17 includes public catalogue/product pages, variations, gallery, fly-out cart, cart and checkout, Stripe Checkout session creation, signed webhook, stock reservation/fulfillment SQL, order emails, payment receipt, and product/order admin. The checkout API returns HTTP 503 unless `SHOP_CHECKOUT_ENABLED=true`. Merely adding Stripe credentials does not enable payments.

The Rotta Supabase project is `wdctbixfjvwbvqlylpuf` (eu-west-1). Migration `supabase/migrations/20261029001200_shop_checkout.sql` has been applied. `supabase/tests/shop_checkout.sql` passed against Rotta inside a rolled-back transaction: anonymous RPC/table denial, stock reservation and insufficient-stock rejection, idempotent release/fulfillment, server-side pricing and totals, Malta-only shipping, VAT rounding, and protection of paid stock. Sequence numbers can advance despite rollback. Checkout table access is intentionally service-role-only. Existing public auth/content function advisories and disabled leaked-password protection remain separate findings.

The live Stripe account was verified as Rotta (`acct_1IqKkAHpCctJw60T`, Malta). Mike supplied a live secret key privately in the ignored local `.env`. On 2026-10-29, a live webhook endpoint was created and enabled:

- Endpoint ID: `we_1UVwHUHpCctJw60THIThHlfN`
- URL: `https://rotta-livid.vercel.app/api/stripe/webhook/`
- Events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`
- Its signing secret is saved privately in ignored `.env` and Vercel **production** environment. `STRIPE_SECRET_KEY` is also configured in both places. Do not read, print, request, or commit either value.
- `SHOP_CHECKOUT_ENABLED=false` is set locally and in Vercel production. Preview environment variables were not changed in this setup.
- Vercel project: `rotta` in team `mikegaucis-projects`. The previous production deployment was redeployed with these variables; deployment `rotta-e0vgvg6u4-mikegaucis-projects.vercel.app` reached READY and the stable alias above served it. This does **not** change rotta.mt DNS.
- A synthetic, signed, otherwise ignored Stripe event returned HTTP 200; the same request with an invalid signature returned HTTP 400. Checkout POST returned HTTP 503. These checks made no charge and exercised no order fulfillment. No full payment lifecycle has been tested.

Local `.env` also stores `STRIPE_WEBHOOK_ENDPOINT_ID` and `STRIPE_WEBHOOK_URL` for reference. `.env.example` documents the required variables. Do not create a duplicate webhook endpoint. The webhook signing secret is generated when the endpoint is created; it cannot be derived from the Stripe API secret key.

The import reconciled helmet-stand variation attributes with saved live WooCommerce markup: original variants 47209 and 47210 both had an empty `attribute_choose-colour` wildcard and equal prices. Variant 47209 is retained; 47210 was removed only after checking there were no order-item references. UI and checkout preserve selected options in the cart identity and order snapshot. No invented colour-to-stitching mapping was used. Digital `buy-a-photo` is draft under the physical-only decision; the importer also drafts virtual/downloadable products. Three historical meal products are hidden from catalogue/related products while their original URLs remain available.

**Payment hardening (PR 15, branch `pr/15-shop-payments`):**

- Lifecycle lives in `@/lib/checkout`: reserve stock → create the Stripe session (request stored, checkout id as idempotency key, one retry on ambiguous errors) → order on payment, or release. A definite Stripe refusal releases at once; an ambiguous failure keeps the stock and returns 503.
- `reconcileCheckouts()` settles reservations past `expires_at` (35 min; sessions last 30): it finds the session even if its id was never saved (by listing sessions around the reservation time), fulfils it if paid, otherwise expires it in Stripe and releases the stock. It also retries unsent order emails for 7 days. It runs after every `/api/checkout/` request and daily via Vercel Cron (`vercel.json`, `/api/cron/checkouts/`, needs `CRON_SECRET`).
- The webhook ignores events whose mode doesn't match the key (`event.livemode`), returns 500 only if the order can't be recorded, and never fails on email (the reconciler resends).
- A payment that lands after its reservation was released is still recorded: stock is taken again (can go negative) and the order gets an admin note.
- Test mode: `sk_test_` keys mark checkouts and orders `livemode=false`. Admin → Orders hides them (link "Test orders"), and test orders get "[TEST]" email subjects. "Delete test orders and restore their stock" calls `purge_test_shop_checkouts()`, which never touches live rows.
- Admin product saves are one transaction (`admin_save_product()`), refusing to move another product's variants. The order-note form keeps its values when a save fails.
- Tests: `supabase/tests/shop_checkout.sql` and `supabase/tests/admin_save_product.sql` (rollback-only). Local Stripe testing without the Stripe CLI: put a test key and any `whsec_…` value in `.env.local`, run `pnpm stripe:forward http://localhost:<port>` (polls Stripe test events and posts them signed), plus `scripts/stripe-replay.mts` (duplicate and bad-signature deliveries) and `scripts/stripe-scenarios.mts` (`start`, `expire`, `race`). All refuse live keys.
- Verified end to end in Stripe test mode on 2026-10-29 (Mike's own test account, not Rotta's): successful card, declined card, 3-D Secure, duplicate webhooks (one order), bad signature (400), expiry releasing stock, lost session id and pre-Stripe crash recovered by the reconciler, a paid session whose webhook was lost recovered by the reconciler, two simultaneous checkouts for the same stock (one wins), and email retry. Its test orders (#50003, #50004), checkouts and test customer were deleted afterwards; stock is back to its original level.

**Still open before enabling live payments:**

1. Mike sets `CRON_SECRET` in Vercel (Production and Preview).
2. Real email sending in test mode is unverified locally (no `RESEND_API_KEY` locally; emails were logged). Check once on a deployment.
3. A Preview webhook needs the preview URL reachable by Stripe (Vercel deployment protection blocks it), so Preview checkout has no webhook; the reconciler still settles orders there.
4. Catalogue: `mdina-grand-prix` has a stock-managed parent at 0 (out of stock) while one variant has 2 in stock, so it can't be bought; check against live WooCommerce.
5. After go-live, live payments need Mike's approval: set `SHOP_CHECKOUT_ENABLED=true` in Production only then. Optional final check: one small real purchase by Mike, refunded through the API.

### PR 12: merged state

Homepage uses the original garage MP4 and artwork, Super 90 video, Best in Show story, directory/shop/events panels and shared contact form. `/contact-us/` uses the original Ferrari hero; `/privacy-policy/` uses published imported content and SEO. Marketplace and Instagram are omitted per product decisions. Imported policy CSS was scoped to `.privacy-content` after detecting list-style leakage into navigation. The newsletter remains low priority and is not wired.

PR #18 passed lint, typecheck, production build (469 pages), and diff checks. Desktop home/contact comparisons and 390px mobile home/contact checks showed working video/images, no horizontal overflow, and empty-form validation; no real email was sent. The browser connection failed during the final privacy-policy screenshot recheck, so inspect that page again during PR 13. No DNS work was done.

### PR 13: SEO and QA

Done: shared metadata helper on every public page; Yoast titles resolved by the importer and backfilled into `posts.seo`/`pages.seo`; sitemap, robots, GA4 (live host only); proxy redirects plus uploads redirects; retired-URL 301s (`20261029001300_retired_url_redirects.sql`); 404 page with site chrome. Every URL in the live Yoast sitemaps (469) returns 200 or 301 on a production build; only `/test/`, `/test34rt/` and `/slide-anything-popup-preview/` 404 by design. A crawl of all 420 pages found no broken internal links or images. Mobile (375px) sweep of 21 page types found no horizontal overflow or broken images. Privacy page: removed the duplicate visible heading.

Remaining gaps:

- `/my-business/` with a business-owner account (logo upload, owner restrictions) is **untested**: it needs Mike (or a test owner account he creates) to sign in. The admin visual pass also needs a signed-in session.
- Unknown slugs: the first request streams HTTP 200 with `noindex` before the route caches a 404 (Next.js streaming behaviour); later requests return 404.
- `/product-category/*` and `/product-tag/*` redirect to `/shop/`; there are no product category/tag pages. Author archives exist but are not in the sitemap (as with Yoast).
- Marketplace vehicle titles use the page heading (e.g. "Porsche 911 Carrera S (992) 2019") where live used the shorter post title; marketplace is noindex.

**PR 14 checklist addition:** set `NEXT_PUBLIC_SITE_URL=https://rotta.mt` in Vercel production before the DNS switch, or robots stays `Disallow: /`, canonicals point at the alias and GA4 stays off.

Other open to-dos: rotate the legacy Supabase `eyJ` secret for a new-style secret and update local/Vercel env safely; add Cloudflare Turnstile to Add Event only if spam appears. Newsletter is last priority. PR 14 requires final migration sync and explicit DNS approval from Mike; rotta.mt currently remains on WordPress.

### Admin improvements (follow-up to PR 13)

Branch `pr/16-admin-improvements` adds shop sales metrics (7/30/90 days, EUR processing/completed orders by order date in Europe/Malta), a navigable dashboard events calendar, list thumbnails, and media file-type/date/sort filters. Sales reads paginate through every matching order; failed queries show an error rather than incomplete totals. Analytics regression checks: `node --test tests/admin-analytics.test.mjs`.

`/admin/pages/` edits existing pages and creates standalone pages. Known page copy is stored in the existing `pages.seo.content_fields` JSON; defaults preserve the original markup. `pages.seo.managed_content` explicitly enables rich-text replacement for designated editorial areas, with forms/catalogues/calendars retained. Account and checkout pages expose SEO only. Standalone pages support draft/published status, image, HTML, SEO and an admin-only saved-content preview; root URLs are checked against posts and reserved routes. Existing paths remain fixed. Saves invalidate the pages cache and affected route; published standalone pages join the sitemap. No schema migration is needed. A signed-in admin browser pass is still required before merging.
