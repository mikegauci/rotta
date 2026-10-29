"use server";

import { revalidatePath, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { cleanBusiness, type BusinessInput } from "@/lib/business-input";
import {
  insertListing,
  isReservedListingSlug,
  refreshDirectory,
  replaceTerms,
} from "@/lib/directory-write";
import { slugify } from "@/lib/slug";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ListingMeta = {
  slug: string;
  status: Enums<"publish_status">;
  ownerEmail: string;
};

type Db = Awaited<ReturnType<typeof createClient>>;

async function ownerIdFor(db: Db, email: string) {
  const clean = email.trim().toLowerCase();
  if (!clean) return { id: null };
  const { data } = await db
    .from("profiles")
    .select("id")
    .ilike("email", clean)
    .maybeSingle();
  return data ? { id: data.id } : { error: `No account uses ${clean}.` };
}

export async function adminSaveListing(
  id: string | null,
  input: BusinessInput,
  meta: ListingMeta,
): Promise<{ error: string } | { id: string; slug: string }> {
  await assertAdmin();
  const clean = cleanBusiness(input);
  if ("error" in clean) return clean;
  if (!Constants.public.Enums.publish_status.includes(meta.status))
    return { error: "Unknown status." };

  const db = await createClient();
  const owner = await ownerIdFor(db, meta.ownerEmail);
  if ("error" in owner) return { error: owner.error! };

  let listing: { id: string; slug: string };
  let oldSlug: string | null = null;
  if (id) {
    const slug = slugify(meta.slug);
    if (!slug) return { error: "Add a web address (slug)." };
    if (isReservedListingSlug(slug))
      return { error: `“${slug}” is used by another directory page.` };
    const { data: before } = await db
      .from("businesses")
      .select("slug")
      .eq("id", id)
      .single();
    oldSlug = before?.slug ?? null;

    const { error } = await db
      .from("businesses")
      .update(clean.row)
      .eq("id", id);
    if (error) return { error: error.message };
    const restricted = await db.rpc("admin_update_business", {
      target: id,
      new_slug: slug,
      new_status: meta.status,
      new_owner: owner.id as string,
    });
    if (restricted.error) {
      if (restricted.error.code === "23505")
        return {
          error: restricted.error.message.includes("owner")
            ? "That owner already has a listing."
            : "Another listing already uses that web address.",
        };
      return { error: restricted.error.message };
    }
    listing = { id, slug };
  } else {
    const inserted = await insertListing(db, {
      ...clean.row,
      owner_id: owner.id,
      status: meta.status,
    });
    if ("error" in inserted) return { error: inserted.error! };
    listing = inserted.data;
  }

  const termError = await replaceTerms(db, listing.id, clean.termIds);
  if (termError) return { error: termError };

  // Keep old links working when a listing's address changes.
  if (oldSlug && oldSlug !== listing.slug) {
    await db.from("redirects").upsert(
      {
        source: `/directory/${oldSlug}/`,
        destination: `/directory/${listing.slug}/`,
      },
      { onConflict: "source" },
    );
  }

  refreshDirectory(listing.slug, ...(oldSlug ? [oldSlug] : []));
  revalidatePath("/admin/directory/");
  return listing;
}

export async function deleteListing(id: string) {
  await assertAdmin();
  const db = await createClient();
  const { data, error } = await db
    .from("businesses")
    .delete()
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { error: error.message };
  refreshDirectory(data.slug);
  revalidatePath("/admin/directory/");
  return { ok: true };
}

export type TermInput = {
  id: string | null;
  kind: Enums<"directory_term_kind">;
  label: string;
  sortOrder: number;
  iconMediaId: string | null;
};

export async function saveTerm(input: TermInput) {
  await assertAdmin();
  const label = input.label.trim();
  const slug = slugify(label);
  if (!slug) return { error: "Add a name." };
  if (slug === "all") return { error: "“All” is added automatically." };
  if (!Constants.public.Enums.directory_term_kind.includes(input.kind))
    return { error: "Unknown list." };
  const db = await createClient();
  const row = {
    kind: input.kind,
    label,
    slug,
    sort_order: Math.round(input.sortOrder) || 0,
    icon_media_id: input.iconMediaId,
  };
  const { data, error } = input.id
    ? await db
        .from("directory_terms")
        .update(row)
        .eq("id", input.id)
        .select("id")
        .single()
    : await db.from("directory_terms").insert(row).select("id").single();
  if (error)
    return {
      error:
        error.code === "23505"
          ? "That name is already in this list."
          : error.message,
    };
  updateTag("directory");
  revalidatePath("/admin/directory/filters/");
  return { id: data.id };
}

export async function deleteTerm(id: string) {
  await assertAdmin();
  const db = await createClient();
  const { error } = await db.from("directory_terms").delete().eq("id", id);
  if (error) return { error: error.message };
  updateTag("directory");
  revalidatePath("/admin/directory/filters/");
  return { ok: true };
}
