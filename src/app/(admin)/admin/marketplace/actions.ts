"use server";

import { revalidatePath, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { slugify } from "@/lib/slug";
import { Constants, type Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { VEHICLE_FEATURES } from "@/lib/vehicle-features";

export type VehicleInput = {
  id: string | null;
  title: string;
  slug: string;
  cardTitle: string;
  status: Enums<"publish_status">;
  listingStatus: string;
  statusColor: string;
  price: string;
  year: string;
  listedOn: string;
  description: string;
  condition: string;
  sellerDetails: string;
  features: Record<string, { value: string; show: boolean }>;
  imageMediaId: string | null;
  ctaMediaId: string | null;
  photoIds: string[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const COLOR = /^#[0-9a-f]{6}$/i;

function refresh(slugs: string[]) {
  updateTag("vehicles");
  for (const slug of slugs) updateTag(`vehicle:${slug}`);
  revalidatePath("/admin/marketplace/");
}

const text = (value: string, max: number) =>
  value.trim().replace(/\r\n/g, "\n").slice(0, max);

export async function saveVehicle(
  input: VehicleInput,
): Promise<{ error: string } | { id: string; slug: string }> {
  await assertAdmin();
  const title = text(input.title, 200);
  const slug = slugify(input.slug || title);
  if (!title) return { error: "Add a title." };
  if (!slug) return { error: "Add a web address (slug)." };
  if (!Constants.public.Enums.publish_status.includes(input.status))
    return { error: "Unknown status." };
  if (input.listedOn && !DATE.test(input.listedOn))
    return { error: "The listing date doesn’t look right." };
  if (input.statusColor && !COLOR.test(input.statusColor))
    return { error: "The status colour must look like #00876d." };

  const features = Object.fromEntries(
    VEHICLE_FEATURES.map(({ key }) => {
      const f = input.features[key];
      return [
        key,
        { value: text(f?.value ?? "", 120), show: Boolean(f?.show) },
      ];
    }),
  );

  const row = {
    title,
    slug,
    card_title: text(input.cardTitle, 200),
    status: input.status,
    listing_status: text(input.listingStatus, 40) || "For Sale",
    status_color: input.statusColor,
    price: text(input.price, 40),
    year: text(input.year, 20),
    listed_on: input.listedOn || null,
    content: text(input.description, 10000),
    condition: text(input.condition, 120),
    seller_details: text(input.sellerDetails, 1000),
    details: features,
    body_type: features.body_type.value,
    image_media_id: input.imageMediaId,
    cta_media_id: input.ctaMediaId,
  };

  const db = await createClient();
  const previous = input.id
    ? (
        await db
          .from("vehicles")
          .select("slug, status")
          .eq("id", input.id)
          .single()
      ).data
    : null;
  const saved = input.id
    ? await db
        .from("vehicles")
        .update(row)
        .eq("id", input.id)
        .select("id")
        .single()
    : await db.from("vehicles").insert(row).select("id").single();
  if (saved.error)
    return {
      error:
        saved.error.code === "23505"
          ? `Another vehicle already uses /marketplace/${slug}/.`
          : saved.error.message,
    };
  const id = saved.data.id;

  // Replace the photo list in its new order.
  const photoIds = [...new Set(input.photoIds)];
  const cleared = await db.from("vehicle_media").delete().eq("vehicle_id", id);
  if (cleared.error) return { error: cleared.error.message };
  if (photoIds.length) {
    const { error } = await db.from("vehicle_media").insert(
      photoIds.map((media_id, sort_order) => ({
        vehicle_id: id,
        media_id,
        sort_order,
      })),
    );
    if (error) return { error: error.message };
  }

  if (previous && previous.slug !== slug && previous.status === "published") {
    await db.from("redirects").upsert(
      {
        source: `/marketplace/${previous.slug}/`,
        destination: `/marketplace/${slug}/`,
      },
      { onConflict: "source" },
    );
    await db.from("redirects").delete().eq("source", `/marketplace/${slug}/`);
  }

  refresh(previous ? [previous.slug, slug] : [slug]);
  return { id, slug };
}

export async function deleteVehicle(id: string) {
  await assertAdmin();
  const db = await createClient();
  const { data, error } = await db
    .from("vehicles")
    .delete()
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { error: error.message };
  refresh([data.slug]);
  return { ok: true };
}
