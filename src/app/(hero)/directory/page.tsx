import { SearchBox } from "@/components/directory/search-box";
import { ManagedPageContent } from "@/components/managed-page-content";
import Image from "next/image";
import Link from "next/link";
import { CategoryCarousel } from "@/components/directory/category-carousel";
import {
  DirectoryHero,
  yellowButton,
} from "@/components/directory/directory-hero";
import { StepFilter } from "@/components/directory/step-filter";
import { GetInTouch } from "@/components/get-in-touch";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { buildSteps, getDirectory, termsByKind } from "@/lib/directory";
import { codePageMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";

export function generateMetadata() {
  return codePageMetadata("directory", "Directory", {
    image: "/directory/malta-automotive-directory.webp",
  });
}

export default async function DirectoryPage() {
  const { terms } = await getDirectory();
  const steps = buildSteps(terms);
  const services = termsByKind(terms, "service").map((t) => ({
    label: t.label,
    slug: t.slug,
    icon: t.icon ? mediaUrl(t.icon) : null,
  }));

  return (
    <>
      <ManagedPageContent
        path="directory"
        after={
          <div className="mx-auto max-w-[1140px] px-5 py-8">
            <SearchBox size="large" />
          </div>
        }
      >
        <DirectoryHero withSearch />
      </ManagedPageContent>

      <section className="py-5">
        <div className="mx-auto max-w-[1400px]">
          <div className="py-10 text-center">
            <h2 className="text-heading text-[28px] leading-[1.2] md:text-[40px]">
              Step-by-step search
              <br />
              <span className="font-bold">Find exactly what you need!</span>
            </h2>
          </div>
          <StepFilter steps={steps} />
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-[90px]">
        <Image
          src="/directory/directory-bg-1.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-8 lg:grid-cols-[166px_1fr] lg:gap-[60px]">
          <div>
            <h2 className="mb-5 text-[28px] leading-[28px] text-white">
              Browse by
              <br />
              <strong>Category</strong>
            </h2>
            <div className="lg:mt-[100px]">
              <Link href="/directory/search-results/" className={yellowButton}>
                Search All
              </Link>
            </div>
          </div>
          <CategoryCarousel services={services} />
        </div>
      </section>

      <div className="h-[30px]" />
      <GetInTouch />
      <NewsletterSignup />
    </>
  );
}
