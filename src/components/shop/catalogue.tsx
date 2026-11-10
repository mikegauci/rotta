import Image from "next/image";
import { getCatalogueProducts } from "@/lib/shop";
import { ProductCard } from "./product-card";
import { Container } from "@/components/layout/container";
import { mediaUrl } from "@/lib/media";
export async function Catalogue() {
  const products = await getCatalogueProducts();
  return (
    <>
      <section
        className="desk:h-[550px] flex h-[480px] items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url(${mediaUrl("wp/2021/05/shop-banner-image.webp")})`,
        }}
      >
        <Image
          unoptimized
          width={1000}
          height={1000}
          src={"/shop/shop-logo.png"}
          alt="Rotta Shop — Automotive Goodies"
          className="w-[320px] max-w-[80%]"
        />
      </section>
      <Container className="desk:py-16 py-10">
        <h1 className="text-ink mb-10 text-center text-3xl font-black">
          Latest Products
        </h1>
        <div className="desk:grid-cols-3 grid gap-x-7 gap-y-12 sm:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </>
  );
}
