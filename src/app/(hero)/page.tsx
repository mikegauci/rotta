import Image from "next/image";
import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { GetInTouch } from "@/components/get-in-touch";
import { mediaUrl } from "@/lib/media";
import { codePageMetadata } from "@/lib/seo";

const button =
  "inline-block bg-white px-10 py-4 text-xs font-black text-black transition-colors hover:bg-brand";
const heading = "text-[35px] leading-[1.2] font-black";

export function generateMetadata() {
  return codePageMetadata("", "Home");
}

export default function Home() {
  return (
    <>
      <div className="bg-ink text-white">
        <section className="after:to-ink relative overflow-hidden px-5 py-[180px] after:absolute after:inset-x-0 after:bottom-0 after:h-[150px] after:bg-linear-to-b after:from-transparent">
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden
            poster={mediaUrl("wp/2021/01/Parsons-Maserati-1.webp")}
            className="absolute inset-0 size-full object-cover opacity-65"
          >
            <source src="/home/garage-stories.mp4" type="video/mp4" />
          </video>
          <div className="relative z-10 mx-auto max-w-[1140px]">
            <h1 className="mb-[15px] text-[40px] leading-[1.3] font-black">
              Celebrating Malta’s
              <br />
              Automotive Community
            </h1>
            <p className="text-base leading-6">
              Fuelled by two young creatives to preserve our automotive
              heritage,
              <br className="max-md:hidden" /> keeping it alive whilst inspiring
              those who have been missing out.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-[1180px] px-5 py-[50px]">
          <h2 className={`${heading} mb-12`}>
            <span className="text-brand">Watch</span> a dose of
            <br />
            art on wheels
          </h2>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube-nocookie.com/embed/XKpF1zM6lWA"
              title="Super 90 | STORIES ep 021"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="py-8">
              <p className="mb-4 text-sm">FEATURED</p>
              <h3 className="mb-5 text-[45px] leading-none font-black">
                Super 90
              </h3>
              <p className="mb-8 text-base">
                Watch our latest episodes where we share the passion for art in
                motion
              </p>
              <Link href="/watch/" className={button}>
                Watch all videos
              </Link>
            </div>
          </div>
          <h2 className={`${heading} mt-[90px] mb-12`}>
            <span className="text-brand">Read</span> the latest
            <br />
            automotive stories
          </h2>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <Image
              src={mediaUrl("wp/2023/06/Blogs-Thumbnails-600x315-13.webp")}
              alt="Best in Show"
              width={600}
              height={315}
              className="h-auto w-full"
            />
            <div className="py-8">
              <p className="mb-4 text-sm">FEATURED</p>
              <h3 className="mb-5 text-[45px] leading-none font-black">
                Best in Show
              </h3>
              <p className="mb-8 text-base">Check out our latest blog post.</p>
              <Link href="/best-in-show/" className={button}>
                Read
              </Link>
            </div>
          </div>
        </section>
      </div>
      <section className="bg-brand text-black">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 py-[80px] md:grid-cols-2">
          <Image
            src="/home/directory.webp"
            alt="Rotta business directory"
            width={1600}
            height={1000}
            className="h-auto w-full"
          />
          <div className="text-right">
            <h2 className="mb-16 text-[45px] leading-none font-black">
              Join <span className="font-normal">the</span> community
              <br />
              <span className="font-normal">and</span> get discovered
            </h2>
            <Link
              href="/my-business/"
              className="hover:bg-ink inline-block bg-black px-10 py-4 text-xs font-black text-white"
            >
              Add my Business
            </Link>
          </div>
        </div>
      </section>
      <section
        className="bg-ink bg-cover bg-center text-white"
        style={{
          backgroundImage: `url(${mediaUrl("wp/2021/05/shop-banner-image.webp")})`,
        }}
      >
        <div className="mx-auto grid min-h-[580px] max-w-[1180px] items-center gap-8 px-5 py-[80px] md:grid-cols-2">
          <Image
            src="/shop/shop-logo.png"
            alt="Rotta Shop — Automotive Goodies"
            width={1000}
            height={1000}
            className="h-auto w-[320px] max-w-full"
          />
          <div className="text-right">
            <h2 className="mb-16 text-[45px] leading-none font-black">
              Shop <span className="font-normal">with</span> Passion
            </h2>
            <Link href="/shop/" className={button}>
              Visit
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-brand text-black">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-5 py-[80px] md:grid-cols-2">
          <Image
            src="/home/events.webp"
            alt="Automotive events in Malta"
            width={1024}
            height={636}
            className="h-auto w-full"
          />
          <div className="text-right">
            <h2 className="mb-16 text-[45px] leading-none font-black">
              <span className="font-normal">Automotive</span> Events
            </h2>
            <Link
              href="/events/"
              className="hover:bg-ink inline-block bg-black px-10 py-4 text-xs font-black text-white"
            >
              View Calendar of Events
            </Link>
          </div>
        </div>
      </section>
      <GetInTouch />
      <NewsletterSignup />
    </>
  );
}
