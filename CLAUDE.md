# Rotta — rotta.mt rebuild

Rebuild of rotta.mt (Malta automotive community site) from WordPress to **Next.js + Supabase on Vercel**, with a custom in-house CMS. WordPress is retired after launch.

## Ground rules

- **Exact 1:1 design and content** with the live site. When in doubt, compare against https://rotta.mt.
- English only.
- **Never point rotta.mt DNS (Cloudflare) at Vercel without explicit go-ahead from Mike.** Until then everything runs on Vercel preview URLs.
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
- `<GetInTouch />` (`@/components/get-in-touch`) emails `EMAIL_ADMIN_TO` through `sendContactMessage`.
- Marketplace is excluded from `primaryNav` (header and footer menus).
- One PR per plan item, branch `pr/NN-name`, squash-merged with auto-merge on.

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

## Status

- [x] Exports received (DB dump of live rotta.mt, uploads.zip, astra-child.zip; 2026-10-29)
- [x] PR 1 Foundation
- [x] PR 2 Design system and layout
- [x] PR 3 Auth and roles
- [x] PR 6 Admin CMS shell
- [x] PR 2b Email (Resend helper; Supabase SMTP set in dashboard)
- [x] PR 4 Schema
- [x] PR 5 Migration scripts (first import done 2026-10-29)
- [x] PR 7 Blog (public pages)
- [x] PR 7b Blog admin editor
- [x] PR 8 Directory (8a public pages, 8b My Business + admin)
- [x] PR 9 Events
- [x] PR 10 Watch and Marketplace
- [ ] PR 11 Shop
- [x] PR 12 Homepage and static pages
- [ ] PR 13 SEO and QA
- [ ] PR 14 Go-live (only after Mike's go-ahead)

Open to-dos:

- Stripe keys: Mike adds them himself (Vercel env and `.env`); never ask for or handle key values.
- Test My Business (`/my-business/`) with a business owner account, including a logo upload.
- Rotate the legacy Supabase secret key (the `eyJ` one) for a new-style secret key, then update `.env` and Vercel.
- If spam events appear, add Cloudflare Turnstile to the Add Event form.

## PR 11 handoff (in progress, 2026-10-29)

Work is on `pr/11-shop`. **PR 11 is not complete; do not tick it yet.** This is a local checkpoint, not a published PR. Continue in this checkout; do not discard these changes.

Implemented first pass:

- Public shop, `/shop/page/N/`, `/product/<slug>/`, variation selectors, image galleries, related products.
- Persistent fly-out cart, cart/checkout pages, server-validated hosted Stripe Checkout.
- Server-only stock reservation/expiry and atomic idempotent order fulfillment SQL in `supabase/migrations/20261029001200_shop_checkout.sql`.
- Signed Stripe webhook, customer profile creation, order/admin emails with Resend idempotency keys, payment receipt page.
- Products/variants/media/SEO editor and orders list/detail/status/notes admin; sidebar enabled.
- `.env.example` documents `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Mike supplies values; never read/print/request them. Hosted redirect needs no publishable Stripe key.
- Stripe SDK 23.0.1 uses `allowed_payment_method_types: ["card"]` (the older create-session `payment_method_types` parameter was removed). No PayPal.

Verification so far: `pnpm lint`, `pnpm typecheck`, `git diff --check` pass. Live shop and tee product were inspected in the browser. Local browser navigation timed out; **visual parity and checkout have not been verified**. An existing dev process serves this repo on port 3000. No production build or payment test has run.

Next steps, before pushing/opening PR:

1. Refresh Supabase tools. Old chat exposed only supabase6 (Annafatale) and Primary (pantrila/tally-hawk); neither exposed Rotta. Mike says the new connection is **supabase7**. Discover it and verify project `wdctbixfjvwbvqlylpuf` before applying anything. The new checkout migration has **NOT** been applied. Apply via connector, verify RPC access (service role only), run security advisors, regenerate types if useful.
2. Review/harden checkout lifecycle before production: a Stripe request timeout can be ambiguous (session may exist even when create throws); current catch releases the reservation too eagerly. Persist/recover the session using its idempotency key, and ensure reservations never leak after a process crash. Add meaningful tests for duplicate/concurrent fulfillment, expiry/release, insufficient stock, server-side prices, VAT rounding, non-MT addresses, invalid signatures, and email retries. Test keys/webhook setup remain Mike's responsibility.
3. Resolve imported catalogue differences against live site: DB has 18 published products, including three historical meal/event products absent from live shop; inspect catalogue visibility/grouped products. `buy-a-photo` is digital on live site but the product decision says physical products only; ensure it cannot be sold as a physical item. Do not silently ignore this decision.
4. Helmet stand options are `Choose Colour: Walnut (Steel Rod) | Oak (Black Rod)`, but imported variant values still use `choose-stitching-colour: Dark Brown/Light Brown`. Live WooCommerce variation attributes are empty wildcards; do not assume variant mapping without checking. A guessed SQL mapping was deliberately removed; correct importer/data and preserve selected options in order snapshots. Existing `/tmp/rotta-stand.html` has live markup if still available.
5. Browser-check desktop/mobile shop, simple/variable/out-of-stock products, fly-out/cart/checkout/admin against live. Shop banner image is imported at `wp/2021/05/shop-banner-image.webp`; logo was missing from media, so original public artwork is in `public/shop/shop-logo.png`. Check hero/header parity (repo conventions currently put shop under plain layout).
6. Harden admin saves: products/variants/gallery currently save sequentially, so validate/commit atomically if needed; prevent variant IDs from moving between products, including the new-product path. Preserve form values for order-note errors. Completion email failure/retry needs review. Check SEO fields against existing CMS conventions.
7. Run lint/typecheck again, production build (stop dev first), then push and create the single PR with squash auto-merge; attach it. Only tick PR 11 after completion. Never touch DNS or PR 14, or commit `migration/exports/`.

### PR 11 continuation checkpoint (Supabase7 verified)

- Supabase7 (`rotta`, `wdctbixfjvwbvqlylpuf`, ACTIVE_HEALTHY) is now reachable. Applied `20261029001200_shop_checkout.sql` through that connector, including NULL-safe variant price comparison.
- Added `supabase/tests/shop_checkout.sql`; executed successfully against Rotta inside a rolled-back transaction. Checks anonymous RPC/table denial, reservation stock, insufficient stock, idempotent release/fulfillment, server prices, wrong totals, non-MT delivery, VAT rounding, and paid stock protection. Sequence numbers may advance despite rollback.
- Advisors confirm the checkout table is RLS enabled with no browser grants/policies (intentional service-role-only access). Existing public auth/content function advisories and disabled leaked-password protection remain.
- Removed eager stock release after Stripe creation starts: ambiguous failures now retain stock. **This is only the safety half of the fix: durable session recovery/reconciliation and crash cleanup are still required.**
- New-product saves now validate variant ownership too; saves remain sequential and require atomicity review.
- Live saved helmet markup confirms variants 47209/47210 both have empty `attribute_choose-colour` wildcard attributes and identical prices. Kept first matching variant 47209 with `{"Choose Colour":""}`; removed redundant 47210 after verifying no order references. No colour-to-stitching mapping was guessed. UI selects the first matching variant by sort_order; checkout validates and snapshots the selected options, and cart identities include selections. Importer ignores obsolete attribute keys, preserves empty wildcard attributes, and deduplicates identical matches in Woo order.
- `buy-a-photo` set to draft under the physical-only decision; importer now leaves virtual/downloadable products in draft. Other historical catalogue visibility/grouped product differences remain to resolve.
- Local browser navigation still timed out. Production build and final verification results must be checked; do not infer full parity or payment lifecycle coverage from database tests.
- PR 11 remains incomplete/unchecked. Do not auto-merge until recovery, atomic admin writes/email retries, remaining tests, and browser parity are complete.
- Follow-up verification: production build completed (468 pages), lint and typecheck passed. Some final source changes occurred during/after that build, so rebuild the final tree before shipping. The production server (`pnpm start`, port 3000) allowed browser verification of shop, simple keychain product, fly-out cart (€12), and checkout (€12, free MT/Gozo shipping). Desktop/mobile screenshot parity and admin/variable/out-of-stock interactions still remain.
- Added `getCatalogueProducts()` to exclude the three historical meal slugs from catalogue/related products while keeping their archive product URLs. Verify this final change in a fresh build.
- Presence-only env check confirmed both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are absent locally. Mike must configure these himself for real Stripe lifecycle testing; no values were read or requested.


### Shop merge scope

Mike requested pushing/merging and moving to PR 12. The shop implementation is merged with checkout explicitly disabled unless `SHOP_CHECKOUT_ENABLED=true`; adding Stripe keys alone cannot activate payments. Keep this flag false until durable recovery/reconciliation, atomic admin saves, email retry hardening, remaining lifecycle tests, and full browser parity have passed. PR 11 remains unchecked because those acceptance items are outstanding. Continue PR 12 independently; do not enable payments or perform go-live work as part of it.

## PR 12 Homepage and static pages

Implemented on `pr/12-homepage-static` (PR #18): original homepage garage MP4, featured Super 90 video and Best in Show story, directory/shop/events panels, shared contact form on home and `/contact-us/`, published imported privacy content and SEO. Marketplace and Instagram omitted per decisions. Original missing homepage artwork/video is kept in `public/home/`; no new storage uploads or secrets.

Verification: lint, typecheck, production build (469 pages), and diff checks passed. Compared live and local desktop layouts; checked 390px mobile home/contact without horizontal overflow, video playback and image loading, and empty-form validation without sending email. Scoped the imported policy's flat CSS rules to `.privacy-content` after detecting list-style leakage into navigation; verified every generated policy selector is scoped. The browser connection became unavailable during the final policy screenshot recheck, so that visual recheck remains for PR 13. Newsletter wiring remains deferred as originally planned. Stripe/payment activation stays skipped and disabled at Mike's request; no DNS or go-live work performed.
