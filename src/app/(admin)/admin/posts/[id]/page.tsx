import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PostEditor } from "@/components/admin/post-editor";
import { getEditorOptions, getEditorPost } from "@/lib/admin/posts";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const [post, options] = await Promise.all([
    getEditorPost(id),
    getEditorOptions(),
  ]);
  if (!post) notFound();
  return (
    <>
      <AdminPageHeader
        title="Edit post"
        actions={
          <Link href="/admin/posts/" className="text-sm hover:underline">
            ← All posts
          </Link>
        }
      />
      <PostEditor key={post.id} {...options} initial={post} />
    </>
  );
}
