import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Directory" };

const dateFormat = new Intl.DateTimeFormat("en-MT", { dateStyle: "medium" });

export default async function DirectoryAdminPage({
  searchParams,
}: PageProps<"/admin/directory">) {
  const { q, status: statusParam } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const status =
    statusParam === "published" || statusParam === "draft" ? statusParam : "";

  const db = await createClient();
  let query = db
    .from("businesses")
    .select(
      "id, slug, name, location, status, updated_at, owner:profiles(email)",
    )
    .order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  if (status) query = query.eq("status", status);
  const { data: listings, error } = await query;

  return (
    <>
      <AdminPageHeader
        title="Directory"
        description={`${listings?.length ?? 0} listings. Owners’ changes go live straight away.`}
        actions={
          <div className="flex gap-3">
            <Link
              href="/admin/directory/filters/"
              className="rounded-[5px] border border-[#ddd] bg-white px-4 py-2 text-sm font-semibold"
            >
              Filter lists
            </Link>
            <Link
              href="/admin/directory/new/"
              className="bg-brand hover:text-brand rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black"
            >
              New listing
            </Link>
          </div>
        }
      />
      <form className="mb-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name"
          className="w-full max-w-sm rounded border border-[#ddd] bg-white px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded border border-[#ddd] bg-white px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Hidden</option>
        </select>
        <button
          type="submit"
          className="rounded bg-white px-4 text-sm font-semibold"
        >
          Filter
        </button>
      </form>
      {error && (
        <p className="text-coral">Could not load listings: {error.message}</p>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-muted border-b border-[#eee] text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {listings?.map((b) => (
              <tr
                key={b.id}
                className="border-b border-[#f3f3f3] last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/directory/${b.id}/`}
                    className="text-ink font-semibold hover:underline"
                  >
                    {b.name}
                  </Link>
                  <p className="text-muted text-xs">
                    {b.location || `/${b.slug}/`}
                  </p>
                </td>
                <td className="px-4 py-3">{b.owner?.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      b.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-[#eee]"
                    }`}
                  >
                    {b.status === "published" ? "Published" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {dateFormat.format(new Date(b.updated_at))}
                </td>
              </tr>
            ))}
            {listings?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-8 text-center">
                  No listings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
