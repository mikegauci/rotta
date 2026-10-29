import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AddEvent } from "@/components/events/add-event";
import { EventCalendar } from "@/components/events/event-calendar";
import { EventsCarousel } from "@/components/events/events-carousel";
import { Container } from "@/components/layout/container";
import {
  formatEventDate,
  formatEventTime,
  getEvents,
  getPreviousEventProducts,
  isUpcoming,
  maltaToday,
} from "@/lib/events";
import { formatPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Car meets, shows and motoring events around Malta and Gozo: upcoming events and the full calendar.",
};

const heading =
  "text-heading mb-5 pt-[54px] pb-[11px] text-[28px] leading-[28px] font-bold";

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Depends on today's date and the month in the URL, so it renders per request.
async function EventsBody({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  await connection();
  const today = maltaToday();
  const events = await getEvents();

  const upcoming = events
    .filter((e) => isUpcoming(e, today))
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      date: formatEventDate(e.startsOn),
      start: formatEventTime(e.startTime),
      end: formatEventTime(e.endTime),
      poster: e.poster?.path ?? null,
    }));

  const [thisYear, thisMonth] = today.split("-").map(Number);
  const year = Number(one(params["frmcal-year"])) || thisYear;
  const month = Number(one(params["frmcal-month"])) || thisMonth;
  const valid = year >= 2000 && year <= 2100 && month >= 1 && month <= 12;

  return (
    <>
      <EventsCarousel events={upcoming} />
      <h2 className={heading}>Calendar of Events</h2>
      <EventCalendar
        year={valid ? year : thisYear}
        month={valid ? month : thisMonth}
        events={events}
        today={today}
      />
    </>
  );
}

async function PreviousEvents() {
  const products = await getPreviousEventProducts();
  if (!products.length) return null;
  return (
    <>
      <h2 className={heading}>Previous Events</h2>
      <ul className="grid gap-x-[2%] gap-y-8 sm:grid-cols-3">
        {products.map((p) => (
          <li key={p.slug}>
            <Link href={`/product/${p.slug}/`} className="block">
              <div className="relative aspect-[4/5] bg-[#eee]">
                {p.image && (
                  <Image
                    src={mediaUrl(p.image.path)}
                    alt={p.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="text-brand mt-3 mb-[7px] text-[14.72px] leading-[17.7px]">
                {p.name.replace(/ - /g, " – ")}
              </p>
            </Link>
            {p.priceCents !== null && (
              <p className="mb-[7px] text-[13.25px] font-bold">
                {formatPrice(p.priceCents)}
              </p>
            )}
            <Link
              href={`/product/${p.slug}/`}
              className="bg-ink my-[7px] inline-block px-10 py-4 text-[14.72px] leading-[19px] font-bold text-white"
            >
              Read more
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function EventsPage(props: PageProps<"/events">) {
  return (
    <Container className="pb-[80px]">
      <h1 className={heading}>Upcoming Events</h1>
      <Suspense fallback={<div className="min-h-[900px]" />}>
        <EventsBody searchParams={props.searchParams} />
      </Suspense>
      <AddEvent />
      <PreviousEvents />
    </Container>
  );
}
