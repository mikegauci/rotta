import Image from "next/image";
import Link from "next/link";
import { LogoPlaceholder } from "@/components/directory/logo-placeholder";
import { displayName, type Listing } from "@/lib/directory";
import { mediaUrl } from "@/lib/media";

// One row in the search results, like the live "sri-wrapper" cards.
export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/directory/${listing.slug}/`}
      className="text-ink flex items-center rounded-[10px] border border-[#444] p-[1.2rem] transition-opacity duration-300 hover:opacity-75"
    >
      <div className="w-[90px] shrink-0 sm:w-[140px]">
        {listing.logo ? (
          <Image
            src={mediaUrl(listing.logo.path)}
            alt={listing.name}
            width={listing.logo.width ?? 280}
            height={listing.logo.height ?? 280}
            sizes="140px"
            className="h-auto w-full rounded-[10px]"
          />
        ) : (
          <LogoPlaceholder className="rounded-[10px]" />
        )}
      </div>
      <div className="w-full pl-5 sm:pl-8">
        <p className="mb-2 text-[1.3rem] leading-none font-semibold">
          {displayName(listing.name)}
        </p>
        {listing.shortDescription && <p>{listing.shortDescription}</p>}
        {listing.location && (
          <p className="mt-4 flex items-center font-semibold">
            <Image
              src="/directory/location-icon.svg"
              alt=""
              width={15}
              height={20}
              className="mr-2.5 w-[15px]"
            />
            {listing.location}
          </p>
        )}
      </div>
    </Link>
  );
}
