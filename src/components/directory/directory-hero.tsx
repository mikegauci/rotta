import Image from "next/image";
import Link from "next/link";
import { SearchBox } from "@/components/directory/search-box";

export const yellowButton =
  "bg-brand hover:text-brand inline-block rounded-[10px] px-10 py-4 text-xs leading-3 font-extrabold text-black transition-colors hover:bg-black";

// "Malta's Automotive Directory" hero on the directory and results pages.
export function DirectoryHero({
  withSearch = false,
}: {
  withSearch?: boolean;
}) {
  return (
    <section className="relative overflow-hidden px-5 py-[180px]">
      <Image
        src="/directory/directory-bg-2.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="relative mx-auto max-w-[1140px] text-center">
        <h1>
          <Image
            src="/directory/malta-automotive-directory.webp"
            alt="Malta’s Automotive Directory"
            width={444}
            height={211}
            priority
            className={`mx-auto h-auto w-[444px] max-w-full ${withSearch ? "mb-[30px]" : ""}`}
          />
        </h1>
        {withSearch && (
          <>
            <SearchBox size="large" />
            <div className="mt-[30px] flex flex-wrap justify-center gap-8">
              <Link href="/user-registration/" className={yellowButton}>
                Add your Business
              </Link>
              <Link href="/my-business/" className={yellowButton}>
                View your Business
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
