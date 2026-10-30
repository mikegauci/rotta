import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FaEnvelope, FaLaptop, FaPhoneAlt } from "react-icons/fa";
import { LogoPlaceholder } from "@/components/directory/logo-placeholder";
import { OwnerListingLink } from "@/components/directory/owner-listing-link";
import { Container } from "@/components/layout/container";
import { NewsletterSignup } from "@/components/newsletter-signup";
import {
  DAYS,
  displayName,
  formatTime,
  getBusiness,
  getDirectory,
  type Business,
} from "@/lib/directory";
import { mediaUrl } from "@/lib/media";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

// Listings live at /directory/<slug>/, as on WordPress.
export async function generateStaticParams() {
  const { listings } = await getDirectory();
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/directory/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) return notFoundMetadata;
  const description =
    business.seo.description ||
    business.shortDescription ||
    business.description.slice(0, 160) ||
    undefined;
  return pageMetadata({
    name: displayName(business.name),
    path: `/directory/${slug}/`,
    seo: business.seo,
    description,
    image: business.logo?.path,
    type: "article",
  });
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function Details({ business }: { business: Business }) {
  const phones = [business.phone, business.phone2].filter(Boolean);
  return (
    <div className="border border-current p-5 text-[#3a3a3a]">
      <p className="mb-[1.6em] font-bold">OPENING HOURS</p>
      <dl className="mb-[1.6em] grid grid-cols-2 gap-y-[0.6em]">
        {DAYS.map(([day, label]) => {
          const hours = business.openingHours[day];
          return (
            <div key={day} className="contents">
              <dt>{label}</dt>
              <dd className={hours ? "text-[#00d084]" : "text-[#cf2e2e]"}>
                {hours
                  ? `${formatTime(hours.open)} – ${formatTime(hours.close)}`
                  : "Closed"}
              </dd>
            </div>
          );
        })}
      </dl>
      {(phones.length > 0 || business.email || business.website) && (
        <>
          <p className="mb-[1.6em] font-bold">CONTACT DETAILS</p>
          <div className="[&_a]:text-brand space-y-2.5 break-words">
            {phones.length > 0 && (
              <p className="flex flex-wrap items-center">
                <FaPhoneAlt className="mr-3 w-4 shrink-0" aria-hidden />
                {phones.map((phone, i) => (
                  <span key={phone}>
                    {i > 0 && " / "}
                    <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
                  </span>
                ))}
              </p>
            )}
            {business.email && (
              <p className="flex items-center">
                <FaEnvelope className="mr-2.5 w-4 shrink-0" aria-hidden />
                <a href={`mailto:${business.email}`} className="min-w-0">
                  {business.email}
                </a>
              </p>
            )}
            {business.website && (
              <p className="flex items-center">
                <FaLaptop className="mr-3 w-4 shrink-0" aria-hidden />
                <a
                  href={websiteHref(business.website)}
                  target="_blank"
                  rel="noopener nofollow"
                  className="min-w-0"
                >
                  {business.website}
                </a>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

async function ListingView({
  params,
}: Pick<PageProps<"/directory/[slug]">, "params">) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();

  return (
    <article>
      <section className="relative overflow-hidden px-5 py-[180px]">
        <Image
          src="/directory/marketplace-hero-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-35" />
        <h1 className="relative text-center text-[40px] leading-none font-medium text-white md:text-[65px]">
          {displayName(business.name)}
        </h1>
      </section>

      <Container className="py-[50px]">
        <div className="flex flex-col gap-8 md:flex-row md:gap-0">
          <div className="md:w-2/3 md:pr-[15px]">
            <div className="mt-2.5 mb-[30px] flex size-[150px] items-center justify-center overflow-hidden rounded-[10px]">
              {business.logo ? (
                <Image
                  src={mediaUrl(business.logo.path)}
                  alt={business.name}
                  width={business.logo.width ?? 300}
                  height={business.logo.height ?? 300}
                  sizes="150px"
                  className="w-[150px]"
                />
              ) : (
                <LogoPlaceholder />
              )}
            </div>
            <h2 className="mb-5 text-[28px] leading-none font-black">
              {displayName(business.name)}
            </h2>
            <p className="mb-[1.6em] text-sm">
              {business.shortDescription}
              {business.shortDescription && business.location && <br />}
              {business.location}
            </p>
            {business.description && (
              <div className="mb-[1.6em] whitespace-pre-line">
                {business.description}
              </div>
            )}
            {business.address && (
              <>
                <p className="mb-[1.6em] font-bold">Location Address</p>
                <p className="mb-[1.6em]">{business.address}</p>
              </>
            )}
          </div>
          <div className="md:w-1/3 md:p-2.5">
            <Details business={business} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/directory/search-results/" className="text-brand">
            Back to Search Results
          </Link>
          <Suspense fallback={null}>
            <OwnerListingLink businessId={business.id} />
          </Suspense>
        </div>
      </Container>
    </article>
  );
}

export default function ListingPage(props: PageProps<"/directory/[slug]">) {
  return (
    <>
      <Suspense>
        <ListingView params={props.params} />
      </Suspense>
      <NewsletterSignup />
    </>
  );
}
