"use client";

import { useEffect, useRef, useState } from "react";

export function HomeHeroVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Autoplay can begin before hydration attaches the playing listener.
    const video = videoRef.current;
    if (video && !video.paused && video.readyState >= 2) setPlaying(true);
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      aria-hidden
      poster="/home/black-poster.svg"
      onPlaying={() => setPlaying(true)}
      className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${playing ? "opacity-65" : "opacity-0"}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
