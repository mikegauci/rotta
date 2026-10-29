import Link from "next/link";
import { SearchBox } from "@/components/directory/search-box";
import type { Filters, TermKind } from "@/lib/directory";

type Group = {
  kind: TermKind;
  param: string;
  title: string;
  options: { label: string; slug: string }[];
};

// Left column on the results page: keyword search plus a radio list per
// filter step. Plain GET form, so it works without JavaScript.
export function ResultsSidebar({
  groups,
  filters,
}: {
  groups: Group[];
  filters: Filters;
}) {
  return (
    <div className="space-y-6">
      <SearchBox defaultValue={filters.q} />
      <form action="/directory/search-results/" method="get">
        {filters.q && (
          <input type="hidden" name="frm_search" value={filters.q} />
        )}
        {groups.map((group) => (
          <fieldset key={group.kind} className="mb-6">
            <legend className="pb-[3px] text-[15px] leading-[22.5px] font-black text-[#3f4b5b]">
              {group.title}
            </legend>
            {group.options.map((option) => {
              const current =
                filters[group.kind] ?? (group.kind === "region" ? "all" : "");
              return (
                <label
                  key={option.slug}
                  className="mb-0.5 flex cursor-pointer items-start gap-[5px] text-sm leading-[18.2px] font-semibold text-[#444] transition-transform duration-300 hover:translate-x-[5px]"
                >
                  <input
                    type="radio"
                    name={group.param}
                    value={option.label}
                    defaultChecked={current === option.slug}
                    className="accent-ink mt-px size-[18px] shrink-0"
                  />
                  {option.label}
                </label>
              );
            })}
          </fieldset>
        ))}
        <Link
          href="/directory/search-results/"
          className="text-brand text-sm hover:underline"
        >
          Clear Results
        </Link>
        <button
          type="submit"
          className="bg-brand mt-[30px] flex h-12 w-full items-center justify-center rounded-[5px] text-lg font-bold text-white"
        >
          Update Results
        </button>
      </form>
    </div>
  );
}
