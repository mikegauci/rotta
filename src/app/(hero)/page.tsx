import { OrderedSections } from "@/components/ordered-sections";
import { PageText } from "@/components/page-text";
import { getPageFields } from "@/lib/static-pages";
import { ManagedPageContent } from "@/components/managed-page-content";
import Image from "next/image";
import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { GetInTouch } from "@/components/get-in-touch";
import { HomeHeroVideo } from "@/components/home-hero-video";
import { mediaUrl } from "@/lib/media";
import { codePageMetadata } from "@/lib/seo";

const button =
  "inline-block bg-white px-10 py-4 text-xs font-black text-black transition-colors hover:bg-brand";
const heading = "text-[35px] leading-[1.2] font-black";

export function generateMetadata() {
  return codePageMetadata("", "Home");
}

export default async function Home() {
  const fields = await getPageFields("");
  return (
    <>
      <ManagedPageContent path="">
        <OrderedSections order={fields.homeOrder}>
          <div data-cms-section="intro" className="bg-ink text-white">
            <section className="after:to-ink relative overflow-hidden bg-black px-5 py-[180px] after:absolute after:inset-x-0 after:bottom-0 after:h-[150px] after:bg-linear-to-b after:from-transparent">
              {fields.heroMode === "image" ? (
                <Image
                  src={mediaUrl(fields.heroImage)}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover opacity-65"
                />
              ) : (
                <HomeHeroVideo src={fields.heroVideo} />
              )}
              <div className="relative z-10 mx-auto max-w-[1140px]">
                <h1 className="mb-[15px] text-[40px] leading-[1.3] font-black">
                  <PageText path="" name="heading" value={fields.heading}>
                    Celebrating Malta’s
                    <br />
                    Automotive Community
                  </PageText>
                </h1>
                <p className="text-base leading-6">
                  <PageText
                    path=""
                    name="description"
                    value={fields.description}
                  >
                    Fuelled by two young creatives to preserve our automotive
                    heritage,
                    <br className="max-md:hidden" /> keeping it alive whilst
                    inspiring those who have been missing out.
                  </PageText>
                </p>
              </div>
            </section>
            <section className="mx-auto max-w-[1180px] px-5 py-[50px]">
              <h2 className={`${heading} mb-12`}>
                <PageText
                  path=""
                  name="watchHeading"
                  value={fields.watchHeading}
                >
                  <span className="text-brand">Watch</span> a dose of
                  <br />
                  art on wheels
                </PageText>
              </h2>
              <div className="grid items-center gap-8 md:grid-cols-2">
                <iframe
                  className="aspect-video w-full"
                  src={`https://www.youtube-nocookie.com/embed/${fields.videoId}`}
                  title="Super 90 | STORIES ep 021"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="py-8">
                  <p className="mb-4 text-sm">FEATURED</p>
                  <h3 className="mb-5 text-[45px] leading-none font-black">
                    <PageText
                      path=""
                      name="videoTitle"
                      value={fields.videoTitle}
                    >
                      Super 90
                    </PageText>
                  </h3>
                  <p className="mb-8 text-base">
                    <PageText
                      path=""
                      name="videoDescription"
                      value={fields.videoDescription}
                    >
                      Watch our latest episodes where we share the passion for
                      art in motion
                    </PageText>
                  </p>
                  <Link href={fields.videoUrl} className={button}>
                    <PageText
                      path=""
                      name="videoButton"
                      value={fields.videoButton}
                    >
                      Watch all videos
                    </PageText>
                  </Link>
                </div>
              </div>
              <h2 className={`${heading} mt-[90px] mb-12`}>
                <PageText path="" name="readHeading" value={fields.readHeading}>
                  <span className="text-brand">Read</span> the latest
                  <br />
                  automotive stories
                </PageText>
              </h2>
              <div className="grid items-center gap-8 md:grid-cols-2">
                <Image
                  src={mediaUrl(fields.storyImage)}
                  alt="Best in Show"
                  width={600}
                  height={315}
                  className="h-auto w-full"
                />
                <div className="py-8">
                  <p className="mb-4 text-sm">FEATURED</p>
                  <h3 className="mb-5 text-[45px] leading-none font-black">
                    <PageText
                      path=""
                      name="storyTitle"
                      value={fields.storyTitle}
                    >
                      Best in Show
                    </PageText>
                  </h3>
                  <p className="mb-8 text-base">
                    <PageText
                      path=""
                      name="storyDescription"
                      value={fields.storyDescription}
                    >
                      Check out our latest blog post.
                    </PageText>
                  </p>
                  <Link href={fields.storyUrl} className={button}>
                    <PageText
                      path=""
                      name="storyButton"
                      value={fields.storyButton}
                    >
                      Read
                    </PageText>
                  </Link>
                </div>
              </div>
            </section>
          </div>
          <section data-cms-section="directory" className="bg-brand text-black">
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
                  <PageText
                    path=""
                    name="directoryHeading"
                    value={fields.directoryHeading}
                  >
                    Join <span className="font-normal">the</span> community
                    <br />
                    <span className="font-normal">and</span> get discovered
                  </PageText>
                </h2>
                <Link
                  href={fields.directoryUrl}
                  className="hover:bg-ink inline-block bg-black px-10 py-4 text-xs font-black text-white"
                >
                  <PageText
                    path=""
                    name="directoryButton"
                    value={fields.directoryButton}
                  >
                    Add my Business
                  </PageText>
                </Link>
              </div>
            </div>
          </section>
          <section
            data-cms-section="shop"
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
                  <PageText
                    path=""
                    name="shopHeading"
                    value={fields.shopHeading}
                  >
                    Shop <span className="font-normal">with</span> Passion
                  </PageText>
                </h2>
                <Link href={fields.shopUrl} className={button}>
                  <PageText path="" name="shopButton" value={fields.shopButton}>
                    Visit
                  </PageText>
                </Link>
              </div>
            </div>
          </section>
          <section data-cms-section="events" className="bg-brand text-black">
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
                  <PageText
                    path=""
                    name="eventsHeading"
                    value={fields.eventsHeading}
                  >
                    <span className="font-normal">Automotive</span> Events
                  </PageText>
                </h2>
                <Link
                  href={fields.eventsUrl}
                  className="hover:bg-ink inline-block bg-black px-10 py-4 text-xs font-black text-white"
                >
                  <PageText
                    path=""
                    name="eventsButton"
                    value={fields.eventsButton}
                  >
                    View Calendar of Events
                  </PageText>
                </Link>
              </div>
            </div>
          </section>
        </OrderedSections>
      </ManagedPageContent>
      <GetInTouch />
      <NewsletterSignup />
    </>
  );
}
