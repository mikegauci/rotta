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
- `<GetInTouch />` (`@/components/get-in-touch`) emails `EMAIL_ADMIN_TO` through `sendContactMessage`.
- Marketplace is excluded from `primaryNav` (header and footer menus).
- One PR per plan item, branch `pr/NN-name`, squash-merged with auto-merge on.

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
- [ ] PR 8 Directory (8a public pages done; 8b My Business + admin in review)
