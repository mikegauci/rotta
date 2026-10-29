import Image from "next/image";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { getVehicles } from "@/lib/marketplace";
import { codePageMetadata } from "@/lib/seo";

// Kept but unlinked (not in the menus), so it stays out of search results.
export function generateMetadata() {
  return codePageMetadata("marketplace", "Marketplace", { noindex: true });
}

export default async function MarketplacePage() {
  const vehicles = await getVehicles();

  return (
    <>
      <section className="bg-ink relative overflow-hidden px-5 py-[100px] md:py-[180px]">
        <Image
          src="/directory/marketplace-hero-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-35" />
        <h1 className="relative flex justify-center">
          <Image
            src="/marketplace/marketplace-logo.webp"
            alt="Marketplace"
            width={512}
            height={221}
            priority
          />
        </h1>
      </section>

      <section className="px-5 py-10">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 md:grid-cols-2">
          {vehicles.map((v) => (
            <div key={v.slug} className="mx-auto mb-[42px] w-full md:w-[85%]">
              <VehicleCard vehicle={v} />
            </div>
          ))}
          {!vehicles.length && (
            <p className="py-10 text-center md:col-span-2">
              No vehicles listed at the moment.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
