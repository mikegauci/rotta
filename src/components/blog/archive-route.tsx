import type { Metadata } from "next";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Archive } from "@/components/blog/archive";
import { ARCHIVE_PAGE_SIZE, getArchive, type ArchiveKind } from "@/lib/blog";

type Params = Promise<{ slug: string; page?: string }>;

// Shared by /category/, /tag/ and /author/ archives and their /page/N/ URLs.
async function ArchiveView({
  kind,
  params,
}: {
  kind: ArchiveKind;
  params: Params;
}) {
  const { slug, page: pageParam } = await params;
  const archive = await getArchive(kind, slug);
  const page = Number(pageParam ?? 1);
  const pageCount = Math.max(
    1,
    Math.ceil((archive?.posts.length ?? 0) / ARCHIVE_PAGE_SIZE),
  );
  if (!archive || !Number.isInteger(page) || page < 1 || page > pageCount)
    notFound();

  return (
    <Archive
      title={archive.title}
      posts={archive.posts.slice(
        (page - 1) * ARCHIVE_PAGE_SIZE,
        page * ARCHIVE_PAGE_SIZE,
      )}
      page={page}
      pageCount={pageCount}
      basePath={`/${kind}/${slug}/`}
    />
  );
}

export function ArchiveRoute({
  kind,
  params,
}: {
  kind: ArchiveKind;
  params: Params;
}) {
  return (
    <Suspense>
      <ArchiveView kind={kind} params={params} />
    </Suspense>
  );
}

export async function archiveMetadata(
  kind: ArchiveKind,
  params: Params,
): Promise<Metadata> {
  const { slug, page } = await params;
  const archive = await getArchive(kind, slug);
  if (!archive) return notFoundMetadata;
  // Yoast titles: "Stories Archives - Rotta", "Mike, Author at Rotta".
  return pageMetadata({
    name: `${archive.title} Archives`,
    path: `/${kind}/${slug}/${page && page !== "1" ? `page/${page}/` : ""}`,
    seo:
      kind === "author" ? { title: `${archive.title}, Author at Rotta` } : {},
  });
}
