import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  FaFacebook,
  FaLinkedin,
  FaPinterest,
  FaSquareXTwitter,
} from "react-icons/fa6";
import { PhotoCarousel } from "@/components/marketplace/photo-carousel";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { env } from "@/lib/env";
import { getVehicle, getVehicles, type Vehicle } from "@/lib/marketplace";
import { mediaUrl } from "@/lib/media";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";
import { featureDisplay, VEHICLE_FEATURES } from "@/lib/vehicle-features";

// Vehicles live at /marketplace/<slug>/, as on WordPress.
export async function generateStaticParams() {
  const vehicles = await getVehicles();
  return vehicles.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/marketplace/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicle(slug);
  if (!vehicle) return notFoundMetadata;
  const description =
    vehicle.seo.description ||
    `${vehicle.title}${vehicle.price ? `, ${vehicle.price}` : ""}. ${vehicle.description}`
      .slice(0, 160)
      .trim();
  return pageMetadata({
    name: vehicle.title,
    path: `/marketplace/${vehicle.slug}/`,
    seo: vehicle.seo,
    description,
    image: vehicle.image?.path,
    type: "article",
    noindex: true,
  });
}

function Features({ vehicle }: { vehicle: Vehicle }) {
  const shown = VEHICLE_FEATURES.flatMap(({ key }) => {
    const f = vehicle.features[key];
    if (!f?.show || (!f.value && key !== "transmission" && key !== "body_type"))
      return [];
    return [{ key, ...featureDisplay(key, f.value) }];
  });
  if (!shown.length) return null;
  return (
    <ul className="mt-[30px] -ml-[25px] flex flex-wrap">
      {shown.map((f) => (
        <li key={f.key} className="flex w-1/2 items-center md:w-[33%]">
          <Image
            src={`/marketplace/icons/${f.icon}.svg`}
            alt=""
            width={109}
            height={109}
            unoptimized
            className="w-[70%] max-w-[109px] shrink-0"
          />
          <span className="w-full text-sm leading-[21px] font-bold">
            {f.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SellerDetails({ text }: { text: string }) {
  const [first, ...rest] = text.split("\n");
  return (
    <div className="border-2 border-[#222] p-[25px]">
      <h3 className="mb-2.5 text-xl leading-5 font-bold text-black">
        Seller Details
      </h3>
      <p className="mb-2.5">
        <br />
        <strong>{first}</strong>
        {rest.map((line, i) => (
          <span key={i}>
            <br />
            <br />
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: FaFacebook,
      color: "#3b5998",
    },
    {
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      icon: FaSquareXTwitter,
      color: "#55acee",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      icon: FaLinkedin,
      color: "#0077b5",
    },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`,
      icon: FaPinterest,
      color: "#cb2027",
    },
  ];
  return (
    <section className="px-5 py-[50px] text-center">
      <h3 className="mb-2 text-base font-bold text-black">Share</h3>
      <ul className="flex justify-center gap-2.5">
        {links.map(({ label, href, icon: Icon, color }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${label}`}
              style={{ color }}
            >
              <Icon className="size-[30px]" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function VehicleView({
  params,
}: Pick<PageProps<"/marketplace/[slug]">, "params">) {
  const { slug } = await params;
  const vehicle = await getVehicle(slug);
  if (!vehicle) notFound();
  const others = (await getVehicles()).filter((v) => v.slug !== slug);

  return (
    <>
      <section className="bg-ink relative h-[250px] overflow-hidden md:h-[384px]">
        {vehicle.image && (
          <Image
            src={mediaUrl(vehicle.image.path)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black opacity-30" />
      </section>

      <section className="p-5">
        <div className="desk:grid-cols-[2fr_1fr] mx-auto grid max-w-[1200px] grid-cols-1">
          <div className="p-2.5">
            <h1 className="text-heading mb-5 text-[32px] leading-none font-bold md:text-[45px]">
              {vehicle.title}
            </h1>
            <p
              className="text-[22px] leading-[33px] font-bold"
              style={{ color: vehicle.statusColor || "#00876d" }}
            >
              {vehicle.listingStatus}
            </p>
            <div className="h-[3vh] sm:h-[70px]" />
            <h2 className="mb-10 text-xl leading-5 font-bold text-black">
              Description
            </h2>
            <p className="whitespace-pre-line text-black">
              {vehicle.description}
            </p>
            <div className="h-[3vh] sm:h-[50px]" />
            {vehicle.condition && (
              <>
                <h2 className="mb-5 text-xl leading-5 font-bold text-black">
                  Condition
                </h2>
                <p className="leading-none font-bold text-black">
                  {vehicle.condition}
                </p>
              </>
            )}
            <div className="h-[25px]" />
            <Features vehicle={vehicle} />
          </div>
          <div className="max-desk:pt-[50px] p-2.5">
            {vehicle.price && (
              <p className="mb-5 text-[32px] leading-none font-bold text-black md:text-[45px]">
                {vehicle.price}
              </p>
            )}
            <div className="h-[60px]" />
            {vehicle.sellerDetails && (
              <SellerDetails text={vehicle.sellerDetails} />
            )}
          </div>
        </div>
      </section>

      {vehicle.photos.length > 0 && (
        <section>
          <div className="mx-auto max-w-[1240px] px-5 pt-5">
            <h2 className="mb-[15px] text-xl leading-5 font-bold text-black">
              Photos
            </h2>
          </div>
          <PhotoCarousel photos={vehicle.photos.map((p) => mediaUrl(p.path))} />
        </section>
      )}

      <ShareLinks
        url={`${env.siteUrl}/marketplace/${vehicle.slug}/`}
        title={vehicle.title}
      />

      {others.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 py-5">
          <h2 className="mb-5 text-xl leading-5 font-bold text-black">
            Other Vehicles
          </h2>
          <div className="grid grid-cols-1 gap-[42px] md:grid-cols-3">
            {others.slice(0, 3).map((v) => (
              <VehicleCard key={v.slug} vehicle={v} small />
            ))}
          </div>
        </section>
      )}

      <section className="bg-ink relative mt-5 overflow-hidden px-5 py-[100px] text-center">
        {(vehicle.cta ?? vehicle.image) && (
          <Image
            src={mediaUrl((vehicle.cta ?? vehicle.image)!.path)}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black opacity-30" />
        <div className="relative">
          <h2 className="mb-[15px] text-[36px] leading-none font-bold text-white md:text-[60px]">
            Have a car worth listing?
          </h2>
          <Link
            href="/contact-us/"
            className="inline-block rounded-full bg-black px-10 py-4 text-xs leading-3 font-extrabold text-white"
          >
            Get in touch!
          </Link>
        </div>
      </section>
    </>
  );
}

export default function VehiclePage(props: PageProps<"/marketplace/[slug]">) {
  return (
    <Suspense>
      <VehicleView params={props.params} />
    </Suspense>
  );
}
