import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import {
  formatEventDate,
  formatEventTime,
  getEvent,
  getEvents,
  type EventDetail,
} from "@/lib/events";
import { mediaUrl } from "@/lib/media";

// Events live at /events/<slug>/, as on WordPress.
export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};
  const description =
    event.seo.description ||
    `${formatEventDate(event.startsOn)}${event.location ? ` at ${event.location}` : ""}. ${event.description}`
      .slice(0, 160)
      .trim();
  return {
    title: event.seo.title || event.title,
    description,
    robots: event.seo.noindex ? { index: false } : undefined,
    openGraph: {
      title: event.title,
      description,
      images: event.poster ? [mediaUrl(event.poster.path)] : undefined,
    },
  };
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function Details({ event }: { event: EventDetail }) {
  const rows: [string, React.ReactNode][] = [];
  if (event.location) rows.push(["Location", event.location]);
  rows.push(["Date Start", formatEventDate(event.startsOn)]);
  if (event.endsOn && event.endsOn !== event.startsOn)
    rows.push(["Date End", formatEventDate(event.endsOn)]);
  if (event.startTime)
    rows.push(["Time Start", formatEventTime(event.startTime)]);
  if (event.endTime) rows.push(["Time End", formatEventTime(event.endTime)]);
  if (event.contactEmail)
    rows.push([
      "Email",
      <a
        key="email"
        href={`mailto:${event.contactEmail}`}
        className="text-brand block break-words"
      >
        {event.contactEmail}
      </a>,
    ]);
  if (event.facebookUrl)
    rows.push([
      "Facebook Event Link",
      <a
        key="fb"
        href={websiteHref(event.facebookUrl)}
        target="_blank"
        rel="noopener"
        className="text-brand"
      >
        Click link here
      </a>,
    ]);

  return (
    <div className="border border-current p-5 text-[#3a3a3a]">
      <p className="mb-[20.5px] text-2xl font-bold">Event Details</p>
      {rows.map(([label, value]) => (
        <p key={label} className="mb-[20.5px]">
          <strong>{label}:</strong> {value}
        </p>
      ))}
    </div>
  );
}

async function EventView({
  params,
}: Pick<PageProps<"/events/[slug]">, "params">) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <article>
      <section className="relative overflow-hidden px-5 py-[180px]">
        <Image
          src="/directory/marketplace-hero-banner.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-35" />
        <h1 className="relative text-center text-[40px] leading-none font-medium text-white md:text-[65px]">
          {event.title}
        </h1>
      </section>

      <Container className="py-[50px]">
        <div className="flex flex-col gap-8 md:flex-row md:gap-0">
          <div className="md:w-2/3 md:pr-[15px]">
            {event.poster && (
              <Image
                src={mediaUrl(event.poster.path)}
                alt={event.poster.alt || event.title}
                width={event.poster.width ?? 1200}
                height={event.poster.height ?? 800}
                sizes="(min-width: 768px) 66vw, 100vw"
                className="mt-2.5 mb-[30px] h-auto w-full"
              />
            )}
            <h2 className="mb-5 text-[28px] leading-none font-black">
              {event.title}
            </h2>
            {event.organiser && (
              <p className="mb-[1.6em] text-sm">{event.organiser}</p>
            )}
            {event.description && (
              <div className="mb-[1.6em] space-y-[1.6em]">
                {event.description.split(/\n\s*\n/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            )}
            <p>
              <Link href="/events/" className="text-brand">
                Back to Events page
              </Link>
            </p>
            <p className="mt-6">
              <Link href="/events/#add-event" className="text-brand">
                Add a new event
              </Link>
            </p>
          </div>
          <div className="md:w-1/3 md:px-2.5">
            <Details event={event} />
          </div>
        </div>
      </Container>
    </article>
  );
}

export default function EventPage(props: PageProps<"/events/[slug]">) {
  return (
    <Suspense>
      <EventView params={props.params} />
    </Suspense>
  );
}
