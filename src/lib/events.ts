import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MediaInfo } from "@/lib/blog";
import { publicDb } from "@/lib/supabase/public";

export type EventSummary = {
  slug: string;
  title: string;
  startsOn: string; // YYYY-MM-DD
  endsOn: string | null;
  startTime: string | null; // HH:MM:SS
  endTime: string | null;
  poster: MediaInfo | null;
};

export type EventDetail = EventSummary & {
  id: string;
  organiser: string;
  location: string;
  description: string;
  facebookUrl: string;
  contactEmail: string;
  seo: { title?: string; description?: string; noindex?: boolean };
};

const SUMMARY = `slug, title, starts_on, ends_on, start_time, end_time,
  poster:media(path, width, height, alt)`;

type SummaryRow = {
  slug: string;
  title: string;
  starts_on: string;
  ends_on: string | null;
  start_time: string | null;
  end_time: string | null;
  poster: MediaInfo | null;
};

function toSummary(row: SummaryRow): EventSummary {
  return {
    slug: row.slug,
    title: row.title,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    startTime: row.start_time,
    endTime: row.end_time,
    poster: row.poster,
  };
}

// Every published event, oldest first (the calendar and carousel filter it).
export async function getEvents(): Promise<EventSummary[]> {
  "use cache";
  cacheTag("events");
  cacheLife("hours");
  const { data, error } = await publicDb
    .from("events")
    .select(SUMMARY)
    .eq("status", "published")
    .order("starts_on")
    .order("start_time", { nullsFirst: true });
  if (error) throw error;
  return (data as unknown as SummaryRow[]).map(toSummary);
}

export async function getEvent(slug: string): Promise<EventDetail | null> {
  "use cache";
  cacheTag("events", `event:${slug}`);
  cacheLife("hours");
  const { data, error } = await publicDb
    .from("events")
    .select(
      `${SUMMARY}, id, organiser, location, description, facebook_url,
      contact_email, seo`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as SummaryRow & {
    id: string;
    organiser: string;
    location: string;
    description: string;
    facebook_url: string;
    contact_email: string;
    seo: EventDetail["seo"];
  };
  return {
    ...toSummary(row),
    id: row.id,
    organiser: row.organiser,
    location: row.location,
    description: row.description,
    facebookUrl: row.facebook_url,
    contactEmail: row.contact_email,
    seo: row.seo ?? {},
  };
}

// Shop products shown as "Previous Events" (hand-picked on the live page).
const PREVIOUS_EVENT_PRODUCTS = [44650, 37885, 31753];

export type EventProduct = {
  slug: string;
  name: string;
  priceCents: number | null;
  image: MediaInfo | null;
};

export async function getPreviousEventProducts(): Promise<EventProduct[]> {
  "use cache";
  cacheTag("products");
  cacheLife("days");
  const { data } = await publicDb
    .from("products")
    .select(
      "wp_id, slug, name, price_cents, image:media!products_featured_media_id_fkey(path, width, height, alt)",
    )
    .in("wp_id", PREVIOUS_EVENT_PRODUCTS)
    .eq("status", "published");
  return PREVIOUS_EVENT_PRODUCTS.flatMap((wpId) => {
    const p = data?.find((row) => row.wp_id === wpId);
    return p
      ? [
          {
            slug: p.slug,
            name: p.name,
            priceCents: p.price_cents,
            image: p.image,
          },
        ]
      : [];
  });
}

// Today in Malta, as YYYY-MM-DD.
export function maltaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Malta",
  }).format(now);
}

// "2026-11-07" -> "November 7, 2026"
export function formatEventDate(day: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

// "10:00:00" -> "10:00 AM"
export function formatEventTime(time: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function isUpcoming(event: EventSummary, today: string) {
  return (event.endsOn ?? event.startsOn) >= today;
}
