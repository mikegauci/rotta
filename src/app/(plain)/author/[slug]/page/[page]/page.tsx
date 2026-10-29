import { ArchiveRoute, archiveMetadata } from "@/components/blog/archive-route";

export function generateMetadata({
  params,
}: PageProps<"/author/[slug]/page/[page]">) {
  return archiveMetadata("author", params);
}

export default function Page({
  params,
}: PageProps<"/author/[slug]/page/[page]">) {
  return <ArchiveRoute kind="author" params={params} />;
}
