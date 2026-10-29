import { RecentDirectoryListings } from "@/components/admin/recent-directory-listings";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  salesSummary,
  type AnalyticsOrder,
} from "@/lib/admin/analytics";
import {
  MONTHS,
  WEEKDAYS,
  isoDay,
  monthGrid,
  shiftMonth,
} from "@/lib/calendar";
import { maltaToday, formatEventDate } from "@/lib/events";
import { formatPrice } from "@/lib/format";

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const days = params.days === "7" ? 7 : params.days === "90" ? 90 : 30;
  const today = maltaToday();
  const [currentYear, currentMonth] = today.split("-").map(Number);
  const monthParam = typeof params.month === "string" ? params.month : "";
  const valid =
    /^\d{4}-\d{2}$/.test(monthParam) &&
    Number(monthParam.slice(0, 4)) >= 2000 &&
    Number(monthParam.slice(0, 4)) <= 2100 &&
    Number(monthParam.slice(5)) >= 1 &&
    Number(monthParam.slice(5)) <= 12;
  const [year, month] = valid
    ? monthParam.split("-").map(Number)
    : [currentYear, currentMonth];
  const monthStart = isoDay(year, month, 1);
  const next = shiftMonth(year, month, 1);
  const prev = shiftMonth(year, month, -1);
  const monthEnd = addDays(isoDay(next.year, next.month, 1), -1);
  const user = await getCurrentUser();
  const db = await createClient();
  // Fetch every batch: historical WooCommerce orders can exceed the API row limit.
  const orders: AnalyticsOrder[] = [];
  let salesError = false;
  const since = addDays(today, -days * 2);
  for (let offset = 0; ; offset += 1000) {
    const result = await db
      .from("orders")
      .select("id,created_at,status,total_cents,currency")
      .eq("livemode", true)
      .gte("created_at", `${since}T00:00:00Z`)
      .order("created_at")
      .order("id")
      .range(offset, offset + 999);
    if (result.error) {
      salesError = true;
      break;
    }
    orders.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const [calendar, upcoming] = await Promise.all([
    db
      .from("events")
      .select("id,title,starts_on,ends_on")
      .eq("status", "published")
      .lte("starts_on", monthEnd)
      .or(
        `ends_on.gte.${monthStart},and(ends_on.is.null,starts_on.gte.${monthStart})`,
      )
      .order("starts_on"),
    db
      .from("events")
      .select("id,title,starts_on,ends_on,location")
      .eq("status", "published")
      .or(`ends_on.gte.${today},and(ends_on.is.null,starts_on.gte.${today})`)
      .order("starts_on")
      .limit(6),
  ]);
  const sales = salesSummary(orders, today, days);
  const max = Math.max(1, ...sales.series.map((p) => p.revenue));
  const href = (y: number, m: number) =>
    `/admin/?days=${days}&month=${isoDay(y, m, 1).slice(0, 7)}#calendar`;
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.username ?? user?.email}.`}
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Shop analytics</h2>
          <Link href="/admin/tools/?view=reports" className="text-sm underline">
            Detailed sales reports →
          </Link>
        </div>
        <nav aria-label="Sales period" className="flex gap-2">
          {[7, 30, 90].map((n) => (
            <Link
              key={n}
              href={`/admin/?days=${n}&month=${monthStart.slice(0, 7)}`}
              aria-current={days === n ? "page" : undefined}
              className={`rounded px-3 py-2 text-sm ${days === n ? "bg-ink text-white" : "bg-white"}`}
            >
              Last {n} days
            </Link>
          ))}
        </nav>
      </div>
      {salesError ? (
        <p role="alert" className="text-coral rounded bg-white p-5">
          Shop analytics could not be loaded. Try refreshing.
        </p>
      ) : (
        <>
          <p className="text-muted mb-4 text-sm">
            {formatEventDate(sales.start)} – {formatEventDate(today)} ·
            Europe/Malta · EUR. Revenue includes tax and shipping on
            processing/completed orders; refunded and cancelled orders are
            excluded. Orders are grouped by order date.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Revenue", value: formatPrice(sales.revenue) },
              { label: "Paid orders", value: sales.paid },
              {
                label: "Average order value",
                value: formatPrice(sales.average),
              },
              { label: "All orders", value: sales.total },
            ].map((stat) => (
              <Link
                key={stat.label}
                href="/admin/orders/"
                className="rounded-lg bg-white p-5 shadow-sm"
              >
                <p className="text-muted text-sm">{stat.label}</p>
                <p className="text-ink mt-1 text-3xl font-black">
                  {stat.value}
                </p>
              </Link>
            ))}
          </div>
          <section
            className="my-6 rounded-lg bg-white p-5 shadow-sm"
            aria-label="Daily revenue"
          >
            <h3 className="font-bold">Daily sales</h3>
            <p className="text-muted mt-1 text-sm">
              Previous {days} days: {formatPrice(sales.previousRevenue)}
              {sales.previousRevenue > 0
                ? ` · ${((sales.revenue / sales.previousRevenue - 1) * 100).toFixed(1)}% change`
                : ""}{" "}
              · {sales.pending} awaiting payment
            </p>
            <div className="mt-5 overflow-x-auto">
              <div className="flex h-44 min-w-[500px] items-end gap-1">
                {sales.series.map((point) => (
                  <div
                    key={point.day}
                    className="group relative flex h-full min-w-1 flex-1 items-end"
                    title={`${point.day}: ${formatPrice(point.revenue)}, ${point.orders} paid orders`}
                  >
                    <div
                      className="bg-brand w-full rounded-t"
                      style={{
                        height: `${Math.max(1, (point.revenue / max) * 100)}%`,
                      }}
                    />
                    <span className="sr-only">
                      {point.day}: {formatPrice(point.revenue)}, {point.orders}{" "}
                      paid orders
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-muted mt-2 flex justify-between text-xs">
              <span>{sales.start}</span>
              <span>{today}</span>
            </div>
            {sales.paid === 0 && (
              <p className="text-muted mt-4 text-sm">
                No paid orders in this period.
              </p>
            )}
          </section>
        </>
      )}
      <RecentDirectoryListings />
      <section id="calendar" className="mt-8 rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Events calendar</h2>
          <Link href="/admin/events/new/" className="text-sm underline">
            Add event
          </Link>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <Link aria-label="Previous month" href={href(prev.year, prev.month)}>
            ←
          </Link>
          <h3 className="font-bold">
            {MONTHS[month - 1]} {year}
          </h3>
          <Link aria-label="Next month" href={href(next.year, next.month)}>
            →
          </Link>
        </div>
        {calendar.error ? (
          <p role="alert" className="text-coral">
            Could not load the calendar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-sm">
              <thead>
                <tr>
                  {WEEKDAYS.map((d) => (
                    <th key={d} className="p-2 text-left">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthGrid(year, month).map((week, i) => (
                  <tr key={i}>
                    {week.map((day, j) => {
                      const iso = day ? isoDay(year, month, day) : "";
                      return (
                        <td
                          key={j}
                          className={`h-24 border border-black/10 p-2 align-top ${iso === today ? "bg-brand/20" : ""}`}
                        >
                          <span
                            className={
                              iso === today ? "font-black" : "text-muted"
                            }
                          >
                            {day}
                          </span>
                          {day &&
                            calendar.data
                              ?.filter(
                                (e) =>
                                  e.starts_on <= iso &&
                                  (e.ends_on ?? e.starts_on) >= iso,
                              )
                              .map((e) => (
                                <Link
                                  key={e.id}
                                  href={`/admin/events/${e.id}/`}
                                  className="bg-ink mt-1 block rounded px-2 py-1 text-xs text-white hover:underline"
                                >
                                  {e.title}
                                </Link>
                              ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3 className="mt-6 mb-3 font-bold">Upcoming and ongoing</h3>
        {upcoming.error ? (
          <p className="text-coral">Could not load upcoming events.</p>
        ) : upcoming.data?.length ? (
          <ul className="divide-y divide-black/10">
            {upcoming.data.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap justify-between gap-2 py-3"
              >
                <Link
                  href={`/admin/events/${e.id}/`}
                  className="font-semibold hover:underline"
                >
                  {e.title}
                  <span className="text-muted block text-xs font-normal">
                    {e.location}
                  </span>
                </Link>
                <span className="text-sm">
                  {formatEventDate(e.starts_on)}
                  {e.ends_on && e.ends_on !== e.starts_on
                    ? ` – ${formatEventDate(e.ends_on)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-sm">
            No upcoming events. Add an event to start filling the calendar.
          </p>
        )}
        <Link
          href="/admin/events/"
          className="mt-4 inline-block text-sm underline"
        >
          Manage all events →
        </Link>
      </section>
    </>
  );
}
