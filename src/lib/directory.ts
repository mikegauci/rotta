import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MediaInfo } from "@/lib/blog";
import { mediaUrl } from "@/lib/media";
import { slugify } from "@/lib/slug";
import type { Enums } from "@/lib/supabase/database.types";
import { publicDb } from "@/lib/supabase/public";

export type TermKind = Enums<"directory_term_kind">;

export type DirectoryTerm = {
  id: string;
  kind: TermKind;
  slug: string;
  label: string;
  icon: string | null; // storage path
};

export type Listing = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  location: string;
  logo: MediaInfo | null;
  termIds: string[];
  search: string; // lower-cased text for the keyword search
};

export type OpeningHours = Partial<
  Record<Day, { open: string; close: string } | null>
>;

export type Business = Omit<Listing, "termIds" | "search"> & {
  description: string;
  address: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  openingHours: OpeningHours;
  seo: { title?: string; description?: string; noindex?: boolean };
};

export const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
] as const;
export type Day = (typeof DAYS)[number][0];

// Results show 8 listings per page, like the live Formidable view.
export const RESULTS_PAGE_SIZE = 8;

// The URL parameter for each filter step, as on WordPress.
export const STEP_PARAMS: Record<TermKind, string> = {
  vehicle: "vehicles",
  era: "era",
  service: "services",
  region: "region",
};

export async function getDirectory() {
  "use cache";
  cacheTag("directory");
  cacheLife("hours");
  const [terms, listings] = await Promise.all([
    publicDb
      .from("directory_terms")
      .select("id, kind, slug, label, sort_order, icon:media(path)")
      .order("sort_order"),
    publicDb
      .from("businesses")
      .select(
        `id, slug, name, short_description, location, description,
        logo:media(path, width, height, alt), terms:business_terms(term_id)`,
      )
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);
  if (terms.error) throw terms.error;
  if (listings.error) throw listings.error;

  return {
    terms: terms.data.map((t): DirectoryTerm => ({
      id: t.id,
      kind: t.kind,
      slug: t.slug,
      label: t.label,
      icon: t.icon?.path ?? null,
    })),
    listings: listings.data.map((b): Listing => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      shortDescription: b.short_description,
      location: b.location,
      logo: b.logo,
      termIds: b.terms.map((t) => t.term_id),
      search: [b.name, b.short_description, b.location, b.description]
        .join(" ")
        .toLowerCase(),
    })),
  };
}

export function termsByKind(terms: DirectoryTerm[], kind: TermKind) {
  return terms.filter((t) => t.kind === kind);
}

// WordPress links carry labels ("Batteries &amp; Accumulators"), sometimes
// HTML-escaped, so match on the slug of the decoded label.
export function paramSlug(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  return slugify(
    raw
      .replace(/&amp;/g, "&")
      .replace(/&#0?38;/g, "&")
      .trim(),
  );
}

export type Filters = Partial<Record<TermKind, string>> & { q?: string };

export function readFilters(
  params: Record<string, string | string[] | undefined>,
): Filters {
  const filters: Filters = {};
  for (const [kind, param] of Object.entries(STEP_PARAMS) as [
    TermKind,
    string,
  ][]) {
    const slug = paramSlug(params[param]);
    // "All" regions means no region filter.
    if (slug && slug !== "all") filters[kind] = slug;
  }
  const q = params.frm_search ?? params.q;
  const text = (Array.isArray(q) ? q[0] : q)?.trim();
  if (text) filters.q = text;
  return filters;
}

export async function searchListings(filters: Filters) {
  const { terms, listings } = await getDirectory();
  const wanted = (Object.keys(STEP_PARAMS) as TermKind[])
    .filter((kind) => filters[kind])
    .map(
      (kind) =>
        terms.find((t) => t.kind === kind && t.slug === filters[kind])?.id ??
        "unknown",
    );
  const words = filters.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return listings.filter(
    (l) =>
      wanted.every((id) => l.termIds.includes(id)) &&
      words.every((w) => l.search.includes(w)),
  );
}

export async function getBusiness(slug: string): Promise<Business | null> {
  "use cache";
  cacheTag("directory", `business:${slug}`);
  cacheLife("hours");
  const { data, error } = await publicDb
    .from("businesses")
    .select(
      `id, slug, name, short_description, location, description, address,
      phone, phone_2, email, website, opening_hours, seo,
      logo:media(path, width, height, alt)`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    shortDescription: data.short_description,
    location: data.location,
    logo: data.logo,
    description: data.description,
    address: data.address,
    phone: data.phone,
    phone2: data.phone_2,
    email: data.email,
    website: data.website,
    openingHours: (data.opening_hours ?? {}) as OpeningHours,
    seo: (data.seo ?? {}) as Business["seo"],
  };
}

// WordPress showed " - " in titles as an en dash.
export function displayName(name: string) {
  return name.replace(/ - /g, " – ");
}

// "08:00" -> "8:00 AM", as on the live listing pages.
export function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return value;
  const hour = h % 12 || 12;
  return `${hour}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const STEP_COPY: Record<
  TermKind,
  { nav: string; number: string; prompt: string }
> = {
  vehicle: { nav: "Vehicle", number: "Step 01", prompt: "I drive..." },
  era: { nav: "Era", number: "Step 02", prompt: "Its..." },
  service: {
    nav: "Parts/Service",
    number: "Step 03",
    prompt: "I'm looking for...",
  },
  region: { nav: "Region", number: "Step 04", prompt: "Search by region..." },
};

// The four filter steps with their options (regions start with "All").
export function buildSteps(terms: DirectoryTerm[]) {
  return (Object.keys(STEP_PARAMS) as TermKind[]).map((kind) => {
    // Services are listed A-Z in the filter (the carousel keeps sort_order).
    const list = termsByKind(terms, kind);
    if (kind === "service") list.sort((a, b) => a.label.localeCompare(b.label));
    const options = list.map((t) => ({
      label: t.label,
      slug: t.slug,
      icon: t.icon ? mediaUrl(t.icon) : null,
    }));
    if (kind === "region")
      options.unshift({
        label: "All",
        slug: "all",
        icon: "/directory/region-all.svg",
      });
    return { param: STEP_PARAMS[kind], ...STEP_COPY[kind], options };
  });
}
