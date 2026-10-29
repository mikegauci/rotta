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

export type SaveListingResult = { error: string } | { slug: string };

// Business owners create or update their one listing. It goes live straight
// away; admins get an email about new listings so they can review them.
export async function saveMyListing(
  input: BusinessInput,
): Promise<SaveListingResult> {
  const user = await getCurrentUser();
  if (!user || !["business_owner", "admin"].includes(user.role))
    return { error: "Please log in with a business account." };

  const clean = cleanBusiness(input);
  if ("error" in clean) return clean;

  const db = await createClient();
  const { data: existing } = await db
    .from("businesses")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

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
