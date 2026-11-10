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
  const [{ position, animate }, setSlide] = useState({
    position: 1,
    animate: false,
  });
  const count = events.length;
  if (!count) return <p className="mb-10">No upcoming events at the moment.</p>;

  const loops = count > 1;
  // The leading copy allows a backward wrap. Two trailing copies keep both
  // desktop slots filled while sliding forward across the boundary.
  const slides = loops
    ? [events[count - 1], ...events, ...events.slice(0, 2)]
    : events;
  const offset = loops ? position : 0;
  const index = loops ? (position + count - 1) % count : 0;
  const wrapping = loops && (position === 0 || position === count + 1);
  const go = (position: number) => setSlide({ position, animate: true });

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <ul
          className={`flex [--slide:100%] md:[--slide:50%] ${animate ? "transition-transform duration-500 motion-reduce:duration-[1ms]" : ""}`}
          style={{ transform: `translateX(calc(${-offset} * var(--slide)))` }}
          onTransitionEnd={(event) => {
            if (
              wrapping &&
              event.target === event.currentTarget &&
              event.propertyName === "transform"
            ) {
              // Rebase to the identical real view before the next move.
              setSlide({ position: index + 1, animate: false });
            }
          }}
        >
          {slides.map((e, i) => (
            <li
              key={`${e.slug}-${i}`}
              className="w-full shrink-0 pr-2.5 md:w-1/2"
              aria-hidden={i < offset || i > offset + 1}
            >
              <Link
                href={`/events/${e.slug}/`}
                tabIndex={i < offset || i > offset + 1 ? -1 : undefined}
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
      {loops && (
        <>
          <button
            type="button"
            aria-label="Previous events"
            onClick={() => !wrapping && go(position - 1)}
            className="absolute top-[40%] left-5 z-10 grid size-[60px] -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black"
          >
            <FiChevronLeft className="size-10" />
          </button>
          <button
            type="button"
            aria-label="Next events"
            onClick={() => !wrapping && go(position + 1)}
            className="absolute top-[40%] right-5 z-10 grid size-[60px] -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black"
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
                onClick={() => i !== index && go(i + 1)}
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
