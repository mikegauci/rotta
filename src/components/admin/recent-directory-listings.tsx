import Link from "next/link";
import { AdminThumbnail } from "@/components/admin/thumbnail";
import { createClient } from "@/lib/supabase/server";

const dateFormat = new Intl.DateTimeFormat("en-MT", {
  dateStyle: "medium",
  timeZone: "Europe/Malta",
});

export async function RecentDirectoryListings() {
  const db = await createClient();
  const { data: listings, error } = await db
    .from("businesses")
    .select(
      "id,name,location,status,created_at,logo:media!businesses_logo_media_id_fkey(path,alt)",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(6);

  return (
    <section
      className="mt-8 rounded-lg bg-white p-5 shadow-sm"
      aria-labelledby="recent-directory-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="recent-directory-heading" className="text-xl font-bold">
            Recent directory listings
          </h2>
          <p className="text-muted mt-1 text-sm">
            The six newest listings, including hidden listings.
          </p>
        </div>
        <Link href="/admin/directory/" className="text-sm underline">
          View all listings →
        </Link>
      </div>
      {error ? (
        <p role="alert" className="text-coral">
          Could not load recent directory listings. Try refreshing.
        </p>
      ) : listings.length ? (
        <ul className="divide-y divide-black/10">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link
                href={`/admin/directory/${listing.id}/`}
                className="flex flex-wrap items-center gap-3 rounded py-3 hover:bg-black/5"
              >
                <AdminThumbnail image={listing.logo} />
                <div className="min-w-0 flex-1">
                  <p className="text-ink font-semibold break-words">
                    {listing.name}
                  </p>
                  {listing.location && (
                    <p className="text-muted text-sm">{listing.location}</p>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${listing.status === "published" ? "bg-green-100 text-green-800" : "bg-black/5"}`}
                  >
                    {listing.status === "published" ? "Published" : "Hidden"}
                  </span>
                  <p className="text-muted mt-1 text-xs">
                    Added{" "}
                    <time dateTime={listing.created_at}>
                      {dateFormat.format(new Date(listing.created_at))}
                    </time>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-sm">
          No directory listings yet.{" "}
          <Link href="/admin/directory/new/" className="underline">
            Add the first listing
          </Link>
          .
        </p>
      )}
    </section>
  );
}
