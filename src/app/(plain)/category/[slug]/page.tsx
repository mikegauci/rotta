import { ArchiveRoute, archiveMetadata } from "@/components/blog/archive-route";
import { getArchiveParams } from "@/lib/blog";

export async function generateStaticParams() {
  return (await getArchiveParams("category")).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps<"/category/[slug]">) {
  return archiveMetadata("category", params);
}

export default function Page({ params }: PageProps<"/category/[slug]">) {
  return <ArchiveRoute kind="category" params={params} />;
}
