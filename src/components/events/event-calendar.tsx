import Link from "next/link";
import { MonthPicker } from "@/components/events/month-picker";
import {
  MONTHS,
  WEEKDAYS,
  isoDay,
  monthGrid,
  shiftMonth,
} from "@/lib/calendar";
import type { EventSummary } from "@/lib/events";

function monthHref(year: number, month: number) {
  return `/events/?frmcal-month=${String(month).padStart(2, "0")}&frmcal-year=${year}#calendar`;
}

// "Calendar of Events": a month table with each event on every day it runs.
export function EventCalendar({
  year,
  month,
  events,
  today,
}: {
  year: number;
  month: number;
  events: EventSummary[];
  today: string;
}) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const weeks = monthGrid(year, month);

  const onDay = (day: string) =>
    events.filter((e) => e.startsOn <= day && (e.endsOn ?? e.startsOn) >= day);

  return (
    <div id="calendar" className="w-full overflow-x-auto pt-px">
      <div className="min-w-[760px]">
        <div className="mb-10 flex items-center justify-between">
          <Link
            href={monthHref(prev.year, prev.month)}
            scroll={false}
            className="text-[#bbb] hover:text-[#191919]"
          >
            ← {MONTHS[prev.month - 1]}
          </Link>
          <MonthPicker year={year} month={month} />
          <Link
            href={monthHref(next.year, next.month)}
            scroll={false}
            className="text-[#bbb] hover:text-[#191919]"
          >
            {MONTHS[next.month - 1]} →
          </Link>
        </div>
        <table className="w-full table-fixed border-collapse text-xs text-[#555]">
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th key={d} className="pb-1 text-left font-normal">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, w) => (
              <tr key={w}>
                {week.map((day, i) => {
                  if (!day)
                    return (
                      <td
                        key={i}
                        className="h-[85px] border border-[#bfc3c8]"
                      />
                    );
                  const iso = isoDay(year, month, day);
                  const isToday = iso === today;
                  return (
                    <td
                      key={i}
                      className={`h-[85px] border border-[#bfc3c8] align-top ${isToday ? "bg-brand" : ""}`}
                    >
                      <div
                        className={`flex h-[23px] items-center px-1 text-lg ${isToday ? "font-extrabold text-[#191919]" : ""}`}
                      >
                        {day}
                        {isToday && (
                          <span className="ml-2.5 text-[17px]">Today</span>
                        )}
                      </div>
                      {onDay(iso).map((e) => (
                        <p
                          key={e.slug}
                          className={`mx-1 my-2 truncate rounded-full px-2.5 py-[3px] text-[11.2px] leading-[15.68px] text-white ${
                            (e.endsOn ?? e.startsOn) < today
                              ? "bg-[#c8c8c8]"
                              : "bg-[#191919]"
                          }`}
                        >
                          <Link href={`/events/${e.slug}/`} title={e.title}>
                            {e.title}
                          </Link>
                        </p>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
