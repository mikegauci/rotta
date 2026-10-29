import { AdminThumbnail } from "@/components/admin/thumbnail";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatEventDate, maltaToday } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Events" };

const filters = [
  { label: "Upcoming", value: "" },
  { label: "Past", value: "past" },
  { label: "Drafts", value: "draft" },
] as const;

export default async function EventsAdminPage({
  searchParams,
}: PageProps<"/admin/events">) {
  const { show, q } = await searchParams;
  const view = show === "past" || show === "draft" ? show : "";
  const search = typeof q === "string" ? q.trim() : "";
  const today = maltaToday();

  const db = await createClient();
  let query = db
    .from("events")
    .select(
      "id, slug, title, location, starts_on, ends_on, status, thumbnail:media!events_poster_media_id_fkey(path, alt)",
    )
    .limit(500);
  if (view === "draft")
    query = query
      .eq("status", "draft")
      .order("starts_on", { ascending: false });
  else if (view === "past")
    query = query
      .eq("status", "published")
      .lt("starts_on", today)
      .order("starts_on", { ascending: false });
  else
    query = query
      .eq("status", "published")
      .gte("starts_on", today)
      .order("starts_on");
  if (search) query = query.ilike("title", `%${search}%`);
  const { data: events, error } = await query;

  const href = (v: string) => {
    const p = new URLSearchParams();
    if (v) p.set("show", v);
    if (search) p.set("q", search);
    const s = p.toString();
    return `/admin/events/${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Events"
        description="Tickets and details link out to Facebook."
        actions={
          <Link
            href="/admin/events/new/"
            className="bg-brand hover:text-brand rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black"
          >
            New event
          </Link>
        }
      />
      <Link
        href="/admin/tools/?view=bulk&table=events"
        className="mb-4 inline-block text-sm underline"
      >
        Bulk edit events →
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <nav className="flex gap-1 text-sm" aria-label="Filter">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={href(f.value)}
              aria-current={view === f.value ? "page" : undefined}
              className={`rounded px-3 py-1 ${view === f.value ? "bg-ink text-white" : "bg-white"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form className="flex-1">
          {view && <input type="hidden" name="show" value={view} />}
          <input
            name="q"
            defaultValue={search}
            placeholder="Search titles"
            className="w-full max-w-sm rounded border border-[#ddd] bg-white px-3 py-2 text-sm"
          />
        </form>
      </div>
      {error && (
        <p className="text-coral">Could not load events: {error.message}</p>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-muted border-b border-[#eee] text-xs uppercase">
            <tr>
              <th className="w-20 px-4 py-3">
                <span className="sr-only">Thumbnail</span>
              </th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {events?.map((e) => (
              <tr
                key={e.id}
                className="border-b border-[#f3f3f3] last:border-0"
              >
                <td className="px-4 py-3">
                  <AdminThumbnail image={e.thumbnail} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${e.id}/`}
                    className="text-ink font-semibold hover:underline"
                  >
                    {e.title}
                  </Link>
                  <p className="text-muted text-xs">
                    {e.location || `/events/${e.slug}/`}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatEventDate(e.starts_on)}
                  {e.ends_on && e.ends_on !== e.starts_on
                    ? ` – ${formatEventDate(e.ends_on)}`
                    : ""}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      e.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-[#eee]"
                    }`}
                  >
                    {e.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
              </tr>
            ))}
            {events?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-8 text-center">
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
