import { AdminThumbnail } from "@/components/admin/thumbnail";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Marketplace" };

// Reads the session on every request.
export const instant = false;

export default async function MarketplaceAdminPage() {
  await connection();
  const db = await createClient();
  const { data: vehicles, error } = await db
    .from("vehicles")
    .select(
      "id, slug, title, price, listing_status, status_color, status, thumbnail:media!vehicles_image_media_id_fkey(path, alt)",
    )
    .order("listed_on", { ascending: false, nullsFirst: false });

  return (
    <>
      <AdminPageHeader
        title="Marketplace"
        description="Not linked from the menus; /marketplace/ is hidden from search engines."
        actions={
          <Link
            href="/admin/marketplace/new/"
            className="bg-brand hover:text-brand rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black"
          >
            New vehicle
          </Link>
        }
      />
      <Link
        href="/admin/tools/?view=bulk&table=vehicles"
        className="mb-4 inline-block text-sm underline"
      >
        Bulk edit marketplace →
      </Link>
      {error && (
        <p className="text-coral">Could not load vehicles: {error.message}</p>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-muted border-b border-[#eee] text-xs uppercase">
            <tr>
              <th className="w-20 px-4 py-3">
                <span className="sr-only">Thumbnail</span>
              </th>
              <th className="px-4 py-3 font-semibold">Vehicle</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Sale status</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles?.map((v) => (
              <tr
                key={v.id}
                className="border-b border-[#f3f3f3] last:border-0"
              >
                <td className="px-4 py-3">
                  <AdminThumbnail image={v.thumbnail} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/marketplace/${v.id}/`}
                    className="text-ink font-semibold hover:underline"
                  >
                    {v.title}
                  </Link>
                  <p className="text-muted text-xs">/marketplace/{v.slug}/</p>
                </td>
                <td className="px-4 py-3">{v.price}</td>
                <td
                  className="px-4 py-3 font-bold uppercase"
                  style={{ color: v.status_color || "#00876d" }}
                >
                  {v.listing_status}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      v.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-[#eee]"
                    }`}
                  >
                    {v.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
            {vehicles?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted px-4 py-8 text-center">
                  No vehicles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
