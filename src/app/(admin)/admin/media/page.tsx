import type { Metadata } from "next";
import { MediaCard } from "@/components/admin/media-card";
import { MediaUploader } from "@/components/admin/media-uploader";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Media" };

const PAGE_SIZE = 48;

export default async function MediaPage({
  searchParams,
}: PageProps<"/admin/media">) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("media")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (search) query = query.ilike("file_name", `%${search}%`);
  const { data: items, count, error } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        title="Media"
        description={`${count ?? 0} files. Images, MP4 videos and PDFs up to 20 MB.`}
        actions={<MediaUploader />}
      />
      <form className="mb-6">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by file name"
          className="w-full max-w-sm rounded border border-[#ddd] bg-white px-3 py-2 text-sm"
        />
      </form>
      {error && (
        <p className="text-coral">Could not load media: {error.message}</p>
      )}
      {items?.length === 0 && <p className="text-muted">No files yet.</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items?.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
      {pages > 1 && (
        <nav className="mt-8 flex gap-2 text-sm" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`?page=${n}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              aria-current={n === page ? "page" : undefined}
              className={`rounded px-3 py-1 ${n === page ? "bg-ink text-white" : "bg-white"}`}
            >
              {n}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
