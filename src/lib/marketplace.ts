import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { MediaInfo } from "@/lib/blog";
import { publicDb } from "@/lib/supabase/public";

export type VehicleFeature = { value: string; show: boolean };

export type VehicleCard = {
  slug: string;
  cardTitle: string;
  price: string;
  listingStatus: string;
  statusColor: string;
  year: string;
  listedOn: string | null;
  image: MediaInfo | null;
};

export type Vehicle = VehicleCard & {
  title: string;
  description: string;
  condition: string;
  sellerDetails: string;
  features: Record<string, VehicleFeature>;
  photos: MediaInfo[];
  cta: MediaInfo | null;
  seo: { title?: string; description?: string; noindex?: boolean };
};

const CARD = `slug, title, card_title, price, listing_status, status_color, year,
  listed_on, image:media!vehicles_image_media_id_fkey(path, width, height, alt)`;

type CardRow = {
  slug: string;
  title: string;
  card_title: string;
  price: string;
  listing_status: string;
  status_color: string;
  year: string;
  listed_on: string | null;
  image: MediaInfo | null;
};

function toCard(row: CardRow): VehicleCard {
  return {
    slug: row.slug,
    cardTitle: row.card_title || row.title,
    price: row.price,
    listingStatus: row.listing_status,
    statusColor: row.status_color,
    year: row.year,
    listedOn: row.listed_on,
    image: row.image,
  };
}

// Published vehicles, newest listing first.
export async function getVehicles(): Promise<VehicleCard[]> {
  "use cache";
  cacheTag("vehicles");
  cacheLife("days");
  const { data, error } = await publicDb
    .from("vehicles")
    .select(CARD)
    .eq("status", "published")
    .order("listed_on", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data as unknown as CardRow[]).map(toCard);
}

export async function getVehicle(slug: string): Promise<Vehicle | null> {
  "use cache";
  cacheTag("vehicles", `vehicle:${slug}`);
  cacheLife("days");
  const { data, error } = await publicDb
    .from("vehicles")
    .select(
      `${CARD}, content, condition, seller_details, details, seo,
      cta:media!vehicles_cta_media_id_fkey(path, width, height, alt),
      vehicle_media(sort_order, media(path, width, height, alt))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as CardRow & {
    content: string;
    condition: string;
    seller_details: string;
    details: Record<string, VehicleFeature>;
    seo: Vehicle["seo"];
    cta: MediaInfo | null;
    vehicle_media: { sort_order: number; media: MediaInfo | null }[];
  };
  return {
    ...toCard(row),
    title: row.title,
    description: row.content,
    condition: row.condition,
    sellerDetails: row.seller_details,
    features: row.details ?? {},
    photos: row.vehicle_media
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((p) => (p.media ? [p.media] : [])),
    cta: row.cta,
    seo: row.seo ?? {},
  };
}

// "2021-03-09" -> "09th March 2021", as the live listing cards print it.
export function formatListedOn(day: string | null) {
  if (!day) return "";
  const date = new Date(`${day}T00:00:00Z`);
  const d = date.getUTCDate();
  const suffix =
    d % 10 === 1 && d !== 11
      ? "st"
      : d % 10 === 2 && d !== 12
        ? "nd"
        : d % 10 === 3 && d !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  return `${String(d).padStart(2, "0")}${suffix} ${month} ${date.getUTCFullYear()}`;
}
