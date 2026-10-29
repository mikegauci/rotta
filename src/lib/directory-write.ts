import "server-only";
import { updateTag } from "next/cache";
import { slugify } from "@/lib/slug";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createClient>>;

// Paths under /directory/ that are taken by pages.
const DIRECTORY_RESERVED = new Set(["search-results", "page"]);

export function isReservedListingSlug(slug: string) {
  return DIRECTORY_RESERVED.has(slug);
}

// Inserts a listing, adding -2, -3... to the slug when it is taken. Drafts of
// other owners aren't visible through RLS, so rely on the unique index.
export async function insertListing(
  db: Db,
  row: Omit<TablesInsert<"businesses">, "slug">,
) {
  const base = slugify(row.name) || "business";
  for (let n = 1; n <= 20; n++) {
    const slug =
      n === 1 && !DIRECTORY_RESERVED.has(base) ? base : `${base}-${n}`;
    const { data, error } = await db
      .from("businesses")
      .insert({ ...row, slug })
      .select("id, slug")
      .single();
    if (!error) return { data };
    if (error.code !== "23505") return { error: error.message };
    if (error.message.includes("owner_id"))
      return { error: "You already have a listing." };
  }
  return { error: "Could not pick a web address for this listing." };
}

export async function replaceTerms(
  db: Db,
  businessId: string,
  termIds: string[],
) {
  const removed = await db
    .from("business_terms")
    .delete()
    .eq("business_id", businessId);
  if (removed.error) return removed.error.message;
  if (!termIds.length) return null;
  const added = await db
    .from("business_terms")
    .insert(termIds.map((term_id) => ({ business_id: businessId, term_id })));
  return added.error?.message ?? null;
}

export function refreshDirectory(...slugs: string[]) {
  updateTag("directory");
  for (const slug of slugs) updateTag(`business:${slug}`);
}
