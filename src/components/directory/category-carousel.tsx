"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import type { StepOption } from "@/components/directory/step-filter";

const PER_SLIDE = 14;

export function serviceHref(label: string) {
  const params = new URLSearchParams({ services: label, region: "All" });
  return `/directory/search-results/?${params}`;
}

// "Browse by Category": service tiles, 14 per slide, with dots and a next
// arrow like the Slide Anything carousel on the live site.
export function CategoryCarousel({ services }: { services: StepOption[] }) {
  const slides: StepOption[][] = [];
  for (let i = 0; i < services.length; i += PER_SLIDE)
    slides.push(services.slice(i, i + PER_SLIDE));
  const [index, setIndex] = useState(0);

  return (
    <div className="relative min-w-0">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <ul
              key={i}
              aria-hidden={i !== index}
              className="flex min-h-[311px] w-full shrink-0 flex-wrap content-start gap-2.5 px-[1%]"
            >
              {slide.map((s) => (
                <li key={s.slug} className="mx-auto mb-5 w-[145px] text-center">
                  <Link
                    href={serviceHref(s.label)}
                    tabIndex={i === index ? undefined : -1}
                    className="bg-brand text-ink flex h-[155px] flex-col items-center justify-center rounded-[15px] font-semibold transition-colors hover:bg-white"
                  >
                    {s.icon && (
                      <Image
                        src={s.icon}
                        alt=""
                        width={125}
                        height={125}
                        unoptimized
                        className="size-[125px] p-5"
                      />
                    )}
                    <span className="-mt-[23px] flex min-h-[50px] items-end px-1 pb-[7px] text-sm leading-[1.3] font-bold">
                      {s.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Next categories"
            onClick={() => setIndex((index + 1) % slides.length)}
            className="absolute top-1/2 -right-[50px] hidden -translate-y-1/2 text-white lg:block"
          >
            <FiChevronRight className="size-10 stroke-1" />
          </button>
          <div className="mt-2 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show categories ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`size-2.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
