"use client";

import { useRouter } from "next/navigation";
import { MONTHS } from "@/lib/calendar";

const select =
  "focus-visible:outline-brand cursor-pointer border-0 bg-transparent py-3 pr-8 pl-3 text-base font-extrabold text-[#191919] focus-visible:outline-1";

// Month and year dropdowns above the calendar (frmcal-month / frmcal-year,
// like the WordPress calendar, so old links still work).
export function MonthPicker({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const go = (y: number, m: number) =>
    router.push(
      `/events/?frmcal-month=${String(m).padStart(2, "0")}&frmcal-year=${y}#calendar`,
      {
        scroll: false,
      },
    );
  const years = Array.from({ length: 11 }, (_, i) => 2021 + i);

  return (
    <span className="inline-flex">
      <select
        aria-label="Month"
        value={month}
        onChange={(e) => go(year, Number(e.target.value))}
        className={select}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={year}
        onChange={(e) => go(Number(e.target.value), month)}
        className={select}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </span>
  );
}
