"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { cleanBusiness, type BusinessInput } from "@/lib/business-input";
import {
  insertListing,
  refreshDirectory,
  replaceTerms,
} from "@/lib/directory-write";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SaveListingResult = { error: string } | { slug: string };

// Business owners create or update their one listing. It goes live straight
// away; admins get an email about new listings so they can review them.
export async function saveMyListing(
  listingId: string | null,
  input: BusinessInput,
): Promise<SaveListingResult> {
  const user = await getCurrentUser();
  if (!user || !["business_owner", "admin"].includes(user.role))
    return { error: "Please log in with a business account." };

  const clean = cleanBusiness(input);
  if ("error" in clean) return clean;

  const db = await createClient();
  const { data: existing, error: lookupError } = await db
    .from("businesses")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError)
    return { error: "Could not load your listing. Please try again." };
  if (listingId && existing?.id !== listingId)
    return {
      error:
        "This listing is no longer in your account. Refresh the page before making changes.",
    };
  if (!listingId && existing)
    return {
      error: "You already have a listing. Return to My Business to edit it.",
    };

  let listing: { id: string; slug: string };
  if (existing) {
    const { error } = await db
      .from("businesses")
      .update(clean.row)
      .eq("id", existing.id);
    if (error) return { error: error.message };
    listing = existing;
  } else {
    const inserted = await insertListing(db, {
      ...clean.row,
      owner_id: user.id,
    });
    if ("error" in inserted) return { error: inserted.error! };
    listing = inserted.data;
  }

  const termError = await replaceTerms(db, listing.id, clean.termIds);
  if (termError) return { error: termError };

  refreshDirectory(listing.slug);
  revalidatePath("/my-business/");

  if (!existing && process.env.EMAIL_ADMIN_TO) {
    await sendEmail({
      to: process.env.EMAIL_ADMIN_TO,
      subject: `New directory listing: ${clean.row.name}`,
      heading: "A new business joined the directory",
      paragraphs: [
        `${clean.row.name} was added by ${user.email} and is live now.`,
      ],
      rows: [
        { label: "Business", value: clean.row.name },
        { label: "Location", value: clean.row.location || "—" },
        { label: "Owner", value: user.email },
      ],
      action: {
        label: "View listing",
        href: `${env.siteUrl}/directory/${listing.slug}/`,
      },
    });
  }

  return { slug: listing.slug };
}

export async function deleteMyListing(
  listingId: string,
): Promise<{ error: string } | { deleted: true }> {
  const user = await getCurrentUser();
  if (!user || !["business_owner", "admin"].includes(user.role))
    return { error: "Please log in with a business account." };
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) return { error: "Invalid listing." };

  const db = await createClient();
  const { data, error } = await db
    .from("businesses")
    .delete()
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .select("slug")
    .maybeSingle();
  if (error)
    return { error: "Could not delete your listing. Please try again." };
  if (!data)
    return {
      error:
        "This listing could not be found in your account. Refresh the page and try again.",
    };

  refreshDirectory(data.slug);
  revalidatePath(`/directory/${data.slug}/`);
  revalidatePath("/my-business/");
  return { deleted: true };
}
