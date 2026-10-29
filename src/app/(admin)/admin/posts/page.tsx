import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatPostDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Blog posts" };

const filters = [
  { label: "All", value: "" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
] as const;

export default async function PostsPage({
  searchParams,
}: PageProps<"/admin/posts">) {
  const { status: statusParam, q } = await searchParams;
  const status =
    statusParam === "published" || statusParam === "draft" ? statusParam : "";
  const search = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(
      "id, slug, title, status, published_at, updated_at, categories:post_categories(name)",
    )
    .order("published_at", { ascending: false, nullsFirst: true });
  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("title", `%${search}%`);
  const { data: posts, error } = await query;

  const href = (s: string) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (search) params.set("q", search);
    const qs = params.toString();
    return `/admin/posts/${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Blog posts"
        description={`${posts?.length ?? 0} posts`}
        actions={
          <Link
            href="/admin/posts/new/"
            className="bg-brand hover:text-brand rounded-[5px] px-4 py-2 text-sm font-bold text-black hover:bg-black"
          >
            New post
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <nav className="flex gap-1 text-sm" aria-label="Filter">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={href(f.value)}
              aria-current={status === f.value ? "page" : undefined}
              className={`rounded px-3 py-1 ${status === f.value ? "bg-ink text-white" : "bg-white"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form className="flex-1">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={search}
            placeholder="Search titles"
            className="w-full max-w-sm rounded border border-[#ddd] bg-white px-3 py-2 text-sm"
          />
        </form>
      </div>
      {error && (
        <p className="text-coral">Could not load posts: {error.message}</p>
      )}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-muted border-b border-[#eee] text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Categories</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post) => (
              <tr
                key={post.id}
                className="border-b border-[#f3f3f3] last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/posts/${post.id}/`}
                    className="text-ink font-semibold hover:underline"
                  >
                    {post.title || "(no title)"}
                  </Link>
                  <p className="text-muted text-xs">/{post.slug}/</p>
                </td>
                <td className="px-4 py-3">
                  {post.categories.map((c) => c.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      post.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-[#eee]"
                    }`}
                  >
                    {post.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatPostDate(post.published_at) || "—"}
                </td>
              </tr>
            ))}
            {posts?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-8 text-center">
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
