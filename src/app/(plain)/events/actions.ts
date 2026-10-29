"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp, { type OutputInfo } from "sharp";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { formatEventDate } from "@/lib/events";
import { MEDIA_BUCKET } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

const FIELDS = [
  "title",
  "location",
  "email",
  "organiser",
  "facebook",
  "startsOn",
  "endsOn",
  "startTime",
  "endTime",
  "description",
] as const;
type Field = (typeof FIELDS)[number];

export type SubmitEventState =
  { error: string; fields: Record<Field, string> } | undefined;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_POSTER = 10 * 1024 * 1024;

// Public "Add Event" form. Like the WordPress form, a submission goes live
// straight away, the site admin gets an email, and the visitor lands on the
// new event page.
export async function submitEvent(
  _: SubmitEventState,
  formData: FormData,
): Promise<SubmitEventState> {
  const fields = Object.fromEntries(
    FIELDS.map((f) => [f, String(formData.get(f) ?? "").trim()]),
  ) as Record<Field, string>;
  const fail = (error: string) => ({ error, fields });

  // Bots fill the hidden field or submit instantly.
  const startedAt = Number(formData.get("started_at"));
  if (formData.get("website") || !startedAt || Date.now() - startedAt < 3000)
    return fail("Please try again.");

  if (!fields.title || !fields.location || !fields.email)
    return fail("Please fill in the event title, location and email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    return fail("Please enter a valid email address.");
  if (!DATE.test(fields.startsOn) || !DATE.test(fields.endsOn))
    return fail("Please add the start and end dates.");
  if (fields.endsOn < fields.startsOn)
    return fail("The end date must be on or after the start date.");
  if (!TIME.test(fields.startTime) || !TIME.test(fields.endTime))
    return fail("Please add the start and end times.");
  if (fields.title.length > 150 || fields.description.length > 5000)
    return fail("The title or description is too long.");
  let facebook = fields.facebook;
  if (facebook && !/^https?:\/\//i.test(facebook))
    facebook = `https://${facebook}`;
  if (facebook) {
    try {
      new URL(facebook);
    } catch {
      return fail("The Facebook link doesn’t look right.");
    }
  }

  const db = createAdminClient();
  if (!db)
    return fail("Event submissions aren’t set up yet. Please contact us.");

  // Optional poster: re-encode as WebP (also strips metadata) to save space.
  let posterId: string | null = null;
  const file = formData.get("poster");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_POSTER) return fail("The poster must be under 10 MB.");
    let image: { data: Buffer; info: OutputInfo };
    try {
      image = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      return fail("The poster must be an image (JPG, PNG or WebP).");
    }
    const now = new Date();
    const path = `events/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${slugify(fields.title) || "event"}-${crypto.randomUUID().slice(0, 8)}.webp`;
    const uploaded = await db.storage
      .from(MEDIA_BUCKET)
      .upload(path, image.data, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });
    if (uploaded.error) return fail("The poster could not be uploaded.");
    const media = await db
      .from("media")
      .insert({
        path,
        file_name: file.name.slice(0, 200),
        mime_type: "image/webp",
        size_bytes: image.info.size,
        width: image.info.width,
        height: image.info.height,
        alt: fields.title,
      })
      .select("id")
      .single();
    if (media.error) return fail("The poster could not be saved.");
    posterId = media.data.id;
  }

  const base = slugify(fields.title) || "event";
  let slug = "";
  for (let n = 1; n <= 30 && !slug; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { error } = await db.from("events").insert({
      slug: candidate,
      title: fields.title,
      location: fields.location,
      organiser: fields.organiser,
      description: fields.description,
      starts_on: fields.startsOn,
      ends_on: fields.endsOn,
      start_time: fields.startTime,
      end_time: fields.endTime,
      poster_media_id: posterId,
      facebook_url: facebook,
      contact_email: fields.email,
      status: "published",
    });
    if (!error) slug = candidate;
    else if (error.code !== "23505")
      return fail("Your event could not be saved.");
  }
  if (!slug) return fail("Your event could not be saved.");

  updateTag("events");

  if (process.env.EMAIL_ADMIN_TO) {
    await sendEmail({
      to: process.env.EMAIL_ADMIN_TO,
      replyTo: fields.email,
      subject: `New event submitted: ${fields.title}`,
      heading: "A new event was added",
      paragraphs: [
        "It is live on the Events page now. You can edit or unpublish it in the admin.",
      ],
      rows: [
        { label: "Event", value: fields.title },
        { label: "Date", value: formatEventDate(fields.startsOn) },
        { label: "Location", value: fields.location },
        { label: "Organiser", value: fields.organiser || "—" },
        { label: "Email", value: fields.email },
      ],
      action: { label: "View event", href: `${env.siteUrl}/events/${slug}/` },
    });
  }

  redirect(`/events/${slug}/`);
}
