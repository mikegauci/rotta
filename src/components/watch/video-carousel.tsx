"use client";

import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

export type CarouselVideo = { youtubeId: string; title: string };

const AUTOPLAY_MS = 7000;

// One series on /watch/: two thumbnails per view (one on phones), looping
// autoplay that pauses on hover, arrows and dots like the live Owl carousel.
// The play button opens the video in a lightbox.
export function VideoCarousel({ videos }: { videos: CarouselVideo[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState<CarouselVideo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const count = videos.length;
  const go = (n: number) => setIndex(((n % count) + count) % count);

  useEffect(() => {
    if (paused || playing || count < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [paused, playing, count]);

  useEffect(() => {
    if (playing) dialog.current?.showModal();
  }, [playing]);

  // Repeat the first slide at the end so the last view on desktop is full.
  const slides = count > 1 ? [...videos, videos[0]] : videos;

  return (
    <div
      className="relative pb-[22px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <ul
          className="flex transition-transform duration-[400ms] [--slide:100%] md:[--slide:50%]"
          style={{ transform: `translateX(calc(-${index} * var(--slide)))` }}
        >
          {slides.map((v, i) => {
            const hidden = i < index || i > index + 1;
            return (
              <li
                key={`${v.youtubeId}-${i}`}
                className="w-full shrink-0 px-[1%] md:w-1/2"
                aria-hidden={hidden}
              >
                <div
                  className="relative min-h-[200px] bg-cover bg-center md:min-h-[311px]"
                  style={{
                    backgroundImage: `url("https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg")`,
                  }}
                >
                  <button
                    type="button"
                    tabIndex={hidden ? -1 : undefined}
                    onClick={() => setPlaying(v)}
                    className="absolute top-1/2 left-1/2 size-20 -translate-1/2 rounded-full bg-[url(/watch/play-btn-white.png)] bg-cover opacity-85 transition-opacity duration-300 hover:opacity-100"
                  >
                    <span className="sr-only">Play {v.title}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(index - 1)}
            className="absolute top-[calc(50%-11px)] left-2.5 h-10 w-[30px] -translate-y-1/2 before:absolute before:top-[5px] before:left-2.5 before:size-[30px] before:-rotate-45 before:border-t-4 before:border-l-4 before:border-white"
          />
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(index + 1)}
            className="absolute top-[calc(50%-11px)] right-2.5 h-10 w-[30px] -translate-y-1/2 before:absolute before:top-[5px] before:right-2.5 before:size-[30px] before:rotate-45 before:border-t-4 before:border-r-4 before:border-white"
          />
          <div className="absolute bottom-0 w-full text-center text-xs leading-3">
            {videos.map((v, i) => (
              <button
                key={v.youtubeId}
                type="button"
                aria-label={`Show ${v.title}`}
                aria-current={i === index % count}
                onClick={() => go(i)}
                className="inline-block"
              >
                <span
                  className={`mx-[3px] inline-block size-2.5 rounded-full transition-colors duration-300 hover:bg-white ${
                    i === index % count ? "bg-white" : "bg-white/35"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {playing && (
        <dialog
          ref={dialog}
          onClose={() => setPlaying(null)}
          onClick={(e) =>
            e.target === e.currentTarget && dialog.current?.close()
          }
          aria-label={playing.title}
          className="m-auto w-[min(1280px,92vw)] max-w-none overflow-visible bg-transparent backdrop:bg-black/90"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
            className="absolute -top-10 right-0 text-white"
          >
            <FiX className="size-8" />
          </button>
          <div className="aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
              title={playing.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="size-full"
            />
          </div>
        </dialog>
      )}
    </div>
  );
}
