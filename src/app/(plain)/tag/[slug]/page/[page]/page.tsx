import { ArchiveRoute, archiveMetadata } from "@/components/blog/archive-route";

export function generateMetadata({
  params,
}: PageProps<"/tag/[slug]/page/[page]">) {
  return archiveMetadata("tag", params);
}

export default function Page({ params }: PageProps<"/tag/[slug]/page/[page]">) {
  return <ArchiveRoute kind="tag" params={params} />;
}
