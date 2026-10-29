import { Suspense } from "react";
import { Catalogue } from "@/components/shop/catalogue";
async function Content({ params }: { params: Promise<{ page: string }> }) {
  return <Catalogue page={Number((await params).page)} />;
}
export default function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
