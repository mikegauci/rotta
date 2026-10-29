import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/shop";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/layout/container";
export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await getProduct((await params).slug);
  const seo = p?.seo as {
    title?: string;
    description?: string;
    noindex?: boolean;
  };
  return {
    title: seo?.title ?? p?.name,
    description: seo?.description,
    robots: seo?.noindex ? { index: false } : undefined,
  };
}
async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  return (
    <Container className="desk:py-20 py-12">
      <ProductDetail product={p} />
      <h2 className="text-ink mt-14 mb-8 text-2xl font-black">
        Related products
      </h2>
      <div className="grid gap-7 sm:grid-cols-3">
        {(await getProducts())
          .filter((v) => v.id !== p.id)
          .slice(0, 3)
          .map((v) => (
            <ProductCard key={v.id} product={v} />
          ))}
      </div>
    </Container>
  );
}
export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
