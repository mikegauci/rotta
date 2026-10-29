import { ArchiveRoute, archiveMetadata } from "@/components/blog/archive-route";
import { getArchiveParams } from "@/lib/blog";

export async function generateStaticParams() {
  return (await getArchiveParams("tag")).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps<"/tag/[slug]">) {
  return archiveMetadata("tag", params);
}

export default function Page({ params }: PageProps<"/tag/[slug]">) {
  return <ArchiveRoute kind="tag" params={params} />;
}
