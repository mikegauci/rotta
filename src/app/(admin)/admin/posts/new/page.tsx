import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PostEditor } from "@/components/admin/post-editor";
import { getEditorOptions } from "@/lib/admin/posts";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const [options, me] = await Promise.all([
    getEditorOptions(),
    getCurrentUser(),
  ]);
  return (
    <>
      <AdminPageHeader title="New post" />
      <PostEditor
        {...options}
        initial={{
          id: null,
          title: "",
          slug: "",
          subtitle: "",
          excerpt: "",
          content: "",
          status: "draft",
          publishedAt: null,
          authorId: me?.id ?? null,
          featured: null,
          hero: null,
          categoryIds: [],
          tags: [],
          seo: {},
        }}
      />
    </>
  );
}
