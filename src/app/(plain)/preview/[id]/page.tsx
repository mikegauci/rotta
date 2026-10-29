import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostArticle } from "@/components/blog/post-article";
import { getPreviewPost } from "@/lib/admin/posts";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

// Reads the session, so skip instant-navigation validation.
export const instant = false;

// Admin-only preview of any post (drafts too) in the public layout.
async function Preview({ params }: Pick<PageProps<"/preview/[id]">, "params">) {
  const { id } = await params;
  await requireRole(["admin"], `/preview/${id}/`);
  const post = await getPreviewPost(id);
  if (!post) notFound();
  return (
    <>
      <div className="bg-ink py-2 text-center text-sm text-white">
        Preview, not visible to the public unless published.{" "}
        <Link
          href={`/admin/posts/${post.id}/`}
          className="text-brand underline"
        >
          Back to editor
        </Link>
      </div>
      <PostArticle post={post} previous={null} next={null} />
    </>
  );
}

export default function PreviewPage(props: PageProps<"/preview/[id]">) {
  return (
    <Suspense>
      <Preview params={props.params} />
    </Suspense>
  );
}
