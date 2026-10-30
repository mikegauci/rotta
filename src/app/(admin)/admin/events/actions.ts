"use server";

import { revalidatePath, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { slugify } from "@/lib/slug";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type EventInput = {
  id: string | null;
  title: string;
  slug: string;
  organiser: string;
  location: string;
  description: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  posterMediaId: string | null;
  facebookUrl: string;
  contactEmail: string;
  status: Enums<"publish_status">;
  seo: { title?: string; description?: string; noindex?: boolean };
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function refresh(slugs: string[]) {
  updateTag("events");
  for (const slug of slugs) updateTag(`event:${slug}`);
  revalidatePath("/admin/events/");
}

export async function saveEvent(
  input: EventInput,
): Promise<{ error: string } | { id: string; slug: string }> {
  await assertAdmin("events");
  const title = input.title.trim();
  const slug = slugify(input.slug || title);
  if (!title) return { error: "Add a title." };
  if (!slug) return { error: "Add a web address (slug)." };
  if (!DATE.test(input.startsOn)) return { error: "Add a start date." };
  if (
    input.endsOn &&
    (!DATE.test(input.endsOn) || input.endsOn < input.startsOn)
  )
    return { error: "The end date must be on or after the start date." };
  for (const t of [input.startTime, input.endTime])
    if (t && !TIME.test(t)) return { error: "Times must look like 18:30." };
  if (!Constants.public.Enums.publish_status.includes(input.status))
    return { error: "Unknown status." };
  const email = input.contactEmail.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "That email address doesn’t look right." };
  let facebook = input.facebookUrl.trim();
  if (facebook && !/^https?:\/\//i.test(facebook))
    facebook = `https://${facebook}`;

  const seo = Object.fromEntries(
    Object.entries({
      title: input.seo.title?.trim(),
      description: input.seo.description?.trim(),
      noindex: input.seo.noindex || undefined,
    }).filter(([, v]) => v),
  );

  const row = {
    title,
    slug,
    organiser: input.organiser.trim(),
    location: input.location.trim(),
    description: input.description.trim().replace(/\r\n/g, "\n"),
    starts_on: input.startsOn,
    ends_on: input.endsOn || null,
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    poster_media_id: input.posterMediaId,
    facebook_url: facebook,
    contact_email: email,
    status: input.status,
    seo,
  };

  const db = await createClient();
  const previous = input.id
    ? (
        await db
          .from("events")
          .select("slug, status")
          .eq("id", input.id)
          .single()
      ).data
    : null;
  const saved = input.id
    ? await db
        .from("events")
        .update(row)
        .eq("id", input.id)
        .select("id")
        .single()
    : await db.from("events").insert(row).select("id").single();
  if (saved.error)
    return {
      error:
        saved.error.code === "23505"
          ? `Another event already uses /events/${slug}/.`
          : saved.error.message,
    };

  if (previous && previous.slug !== slug && previous.status === "published") {
    await db.from("redirects").upsert(
      {
        source: `/events/${previous.slug}/`,
        destination: `/events/${slug}/`,
      },
      { onConflict: "source" },
    );
    await db.from("redirects").delete().eq("source", `/events/${slug}/`);
  }

  refresh(previous ? [previous.slug, slug] : [slug]);
  return { id: saved.data.id, slug };
}

export async function deleteEvent(id: string) {
  await assertAdmin("events");
  const db = await createClient();
  const { data, error } = await db
    .from("events")
    .delete()
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { error: error.message };
  refresh([data.slug]);
  return { ok: true };
}
