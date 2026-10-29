import "server-only";
import type { EditorVehicle } from "@/components/admin/vehicle-editor";
import type { PickedMedia } from "@/components/admin/media-picker";
import { createClient } from "@/lib/supabase/server";

export const EMPTY_VEHICLE: EditorVehicle = {
  id: null,
  title: "",
  slug: "",
  cardTitle: "",
  status: "draft",
  listingStatus: "For Sale",
  statusColor: "#00876d",
  price: "",
  year: "",
  listedOn: "",
  description: "",
  condition: "",
  sellerDetails: "",
  features: {},
  image: null,
  cta: null,
  photos: [],
};

const MEDIA = "id, path, width, height, alt";

export async function getEditorVehicle(
  id: string,
): Promise<EditorVehicle | null> {
  const db = await createClient();
  const { data: v } = await db
    .from("vehicles")
    .select(
      `*, image:media!vehicles_image_media_id_fkey(${MEDIA}),
      cta:media!vehicles_cta_media_id_fkey(${MEDIA}),
      vehicle_media(sort_order, media(${MEDIA}))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!v) return null;
  return {
    id: v.id,
    title: v.title,
    slug: v.slug,
    cardTitle: v.card_title,
    status: v.status,
    listingStatus: v.listing_status,
    statusColor: v.status_color,
    price: v.price,
    year: v.year,
    listedOn: v.listed_on ?? "",
    description: v.content,
    condition: v.condition,
    sellerDetails: v.seller_details,
    features: (v.details ?? {}) as EditorVehicle["features"],
    image: v.image,
    cta: v.cta,
    photos: v.vehicle_media
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((p) => (p.media ? [p.media as PickedMedia] : [])),
  };
}
