import Image from "next/image";
import Link from "next/link";

// Right-hand promo column on the results page.
export function Promos() {
  return (
    <div className="space-y-0">
      <Link href="/contact-us/" className="block">
        <Image
          src="/directory/rotta-ad-2.webp"
          alt="Advertise with us"
          width={222}
          height={340}
          className="h-auto w-full"
        />
      </Link>
      <Link href="/shop/" className="block">
        <Image
          src="/directory/rotta-ad-1.webp"
          alt="Automotive goodies in the Rotta shop"
          width={222}
          height={340}
          className="h-auto w-full"
        />
      </Link>
    </div>
  );
}
