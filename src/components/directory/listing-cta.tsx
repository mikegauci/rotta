import Link from "next/link";
import { yellowButton } from "@/components/directory/directory-hero";
import { Container } from "@/components/layout/container";

// "Is your business still not on the list?" banner under the results.
export function ListingCta() {
  return (
    <section className="bg-ink py-[70px]">
      <Container className="flex flex-wrap items-center justify-between gap-6">
        <h2 className="text-[34px] leading-none font-black text-white md:text-[45px]">
          Is your business still
          <br />
          not on the list?
        </h2>
        <Link href="/user-registration/" className={yellowButton}>
          Add your business now
        </Link>
      </Container>
    </section>
  );
}
