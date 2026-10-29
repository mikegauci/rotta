import Image from "next/image";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { VideoCarousel } from "@/components/watch/video-carousel";
import { mediaUrl } from "@/lib/media";
import { getWatchSeries, WATCH_HERO_VIDEO } from "@/lib/watch";
import { codePageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return codePageMetadata("watch", "Watch", {
    image: "wp/2021/01/stories-title-1.webp",
  });
}

export default async function WatchPage() {
  const series = await getWatchSeries();

  return (
    <div className="bg-ink">
      <section className="after:from-ink/0 after:to-ink relative overflow-hidden bg-black px-5 py-[180px] text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[300px] after:bg-linear-to-b">
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
          className="absolute inset-0 size-full object-cover opacity-65"
        >
          <source src={WATCH_HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="relative z-10 mx-auto max-w-[1140px]">
          <h1 className="mb-[15px] text-[40px] leading-[1.3] font-black capitalize">
            Sharing a passion
            <br />
            for art in motion
          </h1>
          <p className="text-base leading-6">
            Watch our latest episodes on some of the best local car stories
            <br className="max-md:hidden" /> and garages! Buckle up! It’s going
            to be a ride to remember!
          </p>
        </div>
      </section>

      {series.map((s) => (
        <section key={s.slug} className="p-5 text-white">
          <div className="mx-auto max-w-[1140px]">
            <div className="h-[3vh] sm:h-[50px]" />
            <h2 className="flex justify-center">
              {s.titleImage ? (
                <Image
                  src={mediaUrl(s.titleImage.path)}
                  alt={s.title}
                  width={300}
                  height={
                    s.titleImage.width && s.titleImage.height
                      ? Math.round(
                          (300 * s.titleImage.height) / s.titleImage.width,
                        )
                      : 100
                  }
                  sizes="300px"
                />
              ) : (
                <span className="text-[40px] font-black">{s.title}</span>
              )}
            </h2>
            {s.description && <p className="text-center">{s.description}</p>}
            <div className="h-[3vh] sm:h-[30px]" />
            <VideoCarousel videos={s.videos} />
            <div className="h-[3vh] sm:h-[50px]" />
          </div>
        </section>
      ))}

      <NewsletterSignup />
    </div>
  );
}
