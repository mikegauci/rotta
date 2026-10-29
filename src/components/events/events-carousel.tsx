"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { mediaUrl } from "@/lib/media";

export type CarouselEvent = {
  slug: string;
  title: string;
  date: string;
  start: string;
  end: string;
  poster: string | null;
};

// "Upcoming Events": two cards per view on desktop, one on phones, with
// arrows and dots like the live Slick carousel.
export function EventsCarousel({ events }: { events: CarouselEvent[] }) {
  const [index, setIndex] = useState(0);
  if (!events.length)
    return <p className="mb-10">No upcoming events at the moment.</p>;
  const last = Math.max(0, events.length - 1);
  const go = (n: number) => setIndex(Math.min(last, Math.max(0, n)));

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <ul
          className="flex transition-transform duration-500 [--slide:100%] md:[--slide:50%]"
          style={{ transform: `translateX(calc(-${index} * var(--slide)))` }}
        >
          {events.map((e, i) => (
            <li
              key={e.slug}
              className="w-full shrink-0 pr-2.5 md:w-1/2"
              aria-hidden={i < index || i > index + 1}
            >
              <Link
                href={`/events/${e.slug}/`}
                tabIndex={i < index || i > index + 1 ? -1 : undefined}
                className="block transition-all duration-300 hover:-translate-y-1.5 hover:opacity-75"
              >
                <div className="relative h-[300px] bg-[#eee]">
                  {e.poster && (
                    <Image
                      src={mediaUrl(e.poster)}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="bg-[#f1f1f1] p-5 text-black">
                  <h3 className="text-heading mb-5 min-h-10 text-[19px] leading-[19px] font-semibold">
                    {e.title}
                  </h3>
                  <span>{e.date}</span>
                  {e.start && <span> – At: {e.start}</span>}
                  {e.end && <span> – Till: {e.end}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {events.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous events"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="absolute top-[40%] left-5 z-10 grid size-[60px] -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black disabled:opacity-0"
          >
            <FiChevronLeft className="size-10" />
          </button>
          <button
            type="button"
            aria-label="Next events"
            onClick={() => go(index + 1)}
            disabled={index >= last}
            className="absolute top-[40%] right-5 z-10 grid size-[60px] -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black disabled:opacity-0"
          >
            <FiChevronRight className="size-10" />
          </button>
          <div className="mt-3 flex justify-center gap-1">
            {events.map((e, i) => (
              <button
                key={e.slug}
                type="button"
                aria-label={`Show ${e.title}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="grid size-5 place-items-center"
              >
                <span
                  className={`size-1.5 rounded-full ${i === index ? "bg-black" : "bg-black/25"}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
