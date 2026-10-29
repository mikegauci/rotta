import { ArchiveRoute, archiveMetadata } from "@/components/blog/archive-route";
import { getArchiveParams } from "@/lib/blog";

export async function generateStaticParams() {
  return (await getArchiveParams("author")).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps<"/author/[slug]">) {
  return archiveMetadata("author", params);
}

export default function Page({ params }: PageProps<"/author/[slug]">) {
  return <ArchiveRoute kind="author" params={params} />;
}
