"use client";

import Image from "next/image";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Full-width vehicle photos: three per view on desktop, one on smaller
// screens, looping, with arrows and dots inside (the live Getwid slider).
export function PhotoCarousel({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  if (!count) return null;
  const go = (n: number) => setIndex(((n % count) + count) % count);
  // Repeat the first two photos so the last desktop views stay full.
  const slides = count > 3 ? [...photos, ...photos.slice(0, 2)] : photos;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <ul
          className="flex transition-transform duration-[600ms] [--slide:100%] lg:[--slide:calc(100%/3)]"
          style={{ transform: `translateX(calc(-${index} * var(--slide)))` }}
        >
          {slides.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="relative h-[300px] w-full shrink-0 md:h-[540px] lg:w-1/3"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </div>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-4 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white text-black"
          >
            <FiChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-4 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white text-black"
          >
            <FiChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-[30px] flex w-full justify-center">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="grid size-5 place-items-center"
              >
                <span
                  className={`size-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
