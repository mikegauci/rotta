import { ArchiveRoute, archiveMetadata } from "@/components/blog/archive-route";

export function generateMetadata({
  params,
}: PageProps<"/category/[slug]/page/[page]">) {
  return archiveMetadata("category", params);
}

export default function Page({
  params,
}: PageProps<"/category/[slug]/page/[page]">) {
  return <ArchiveRoute kind="category" params={params} />;
}
